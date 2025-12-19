export class FirestoreErrorHandler {
  static isBlockedByClientError(error: any): boolean {
    return error.message?.includes('ERR_BLOCKED_BY_CLIENT') || 
           error.message?.includes('net::ERR_BLOCKED_BY_CLIENT') ||
           error.code === 'unavailable' ||
           error.code === 'resource-exhausted'
  }

  static getErrorMessage(error: any): string {
    if (this.isBlockedByClientError(error)) {
      return `Connection blocked by browser extension or ad blocker. 
      
Please:
1. Disable ad blockers (uBlock Origin, AdBlock, etc.)
2. Disable privacy extensions that block third-party requests
3. Allow firestore.googleapis.com in your browser settings
4. Try using incognito/private mode

This app requires Firebase/Firestore access to function properly.`
    }
    
    return error.message || 'An error occurred'
  }

  static handleFirestoreError(error: any, fallbackMessage: string = 'Connection error'): string {
    if (this.isBlockedByClientError(error)) {
      return this.getErrorMessage(error)
    }
    return error.message || fallbackMessage
  }
}

---
title: Retry
---

- `sources` (optional, repeated)

    List of selectors to match dataplanes that retry policy should be
    configured for

- `destinations` (optional, repeated)

    List of selectors to match services that need to be health checked.

- `conf` (optional)

    +required

    Child properties:    
    
    - `http` (optional)
    
        Child properties:    
        
        - `numRetries` (optional)
        
            +optional    
        
        - `perTryTimeout` (optional)
        
            +optional    
        
        - `backOff` (optional)
        
            +optional
        
            Child properties:    
            
            - `baseInterval` (optional)
            
                +required    
            
            - `maxInterval` (optional)
            
                +optional    
        
        - `retriableStatusCodes` (optional, repeated)
        
            +optional    
    
    - `tcp` (optional)
    
        Child properties:    
        
        - `maxConnectAttempts` (optional)
        
            +optional    
    
    - `grpc` (optional)
    
        Child properties:    
        
        - `retryOn` (optional, repeated)
        
            +optional
        
            Supported values:
        
            - `cancelled`
        
            - `deadline_exceeded`
        
            - `internal`
        
            - `resource_exhausted`
        
            - `unavailable`    
        
        - `numRetries` (optional)
        
            +optional    
        
        - `perTryTimeout` (optional)
        
            +optional    
        
        - `backOff` (optional)
        
            +optional
        
            Child properties:    
            
            - `baseInterval` (optional)
            
                +required    
            
            - `maxInterval` (optional)
            
                +optional


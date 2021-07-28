---
title: Traffic log
---


- `sources` (optional, repeated)

    List of selectors to match dataplanes that are sources of traffic.

- `destinations` (optional, repeated)

    List of selectors to match services that are destinations of traffic.

- `conf` (optional)

    Configuration of the logging.

    Child properties:    
    
    - `backend` (optional)
    
        Backend defined in the Mesh entity.


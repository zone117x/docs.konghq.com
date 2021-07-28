---
title: The Kong Mesh control plane
---

The {{site.mesh_product_name}} control plane is the source of truth for dynamic configuration of your service mesh. You can run the control plane on Kubernetes or in Universal mode on any machine -- bare metal, virtual machine running anywhere, or cloud provider (TODO CHECK AND FIX).

The control plane is a single executable wriiten in Go. A single control plane can provide configuration for multiple isolated service meshes or for one mesh only.

## Datastore

Where state and configuration are stored depends on whether you're running the control plane on Kubernetes. TODO FIX UP INSTALL PAGES AND ALSO HERE? You specify the `KUMA_STORE_TYPE` environment variable OR WHEN/WHERE DO YOU WRITE A `conf/kuma-cp.conf` file?!?!?!?) -- 

### Universal mode

In Universal mode, you store all control plane data in a PostgreSQL database -- state, mesh configuration, data plane proxy policies and status, and more. The database is configured {{site.mesh_product_name}} automatically when you install, or you can see [Configure PostGreSQL]() for details.

### Kubernetes mode

On Kubernetes, you rely on etcd, the native datastore for the Kubernetes API server, to store control plane data.

### In memory (not for production)

If you don't specify a datastore type, the default is `memory`, which lets you get up and running quickly to explore {{site.mesh_product_name}} functionality or to test a minimal deployment.

## Control planes in multizone mode

In a multizone deployment, you run a single global control plane for each mesh, and a zone control plane for each zone in the mesh. The global control plane communicates only with the zone control planes, which in turn communicate with the data plane proxies in their zones. For more information, see [About multizone deployments](/how-multi-zone-works/).

## TODO MORE ABOUT CONTROL PLANES???

TK

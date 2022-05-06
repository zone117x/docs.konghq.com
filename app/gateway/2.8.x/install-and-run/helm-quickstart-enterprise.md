---
title: Install Kong Gateway with Helm (Enterprise)
---
{:.badge .enterprise}
This is the quick start enterprise
This page explains how to install {{site.base_gateway}} with {{site.kic_product_name}} using Helm.

* The Enterprise deployment includes a Postgres sub-chart provided by Bitnami.
* For open-source deployments, you can choose to use the Postgres sub-chart, or install without a database.

Configuration for both options is flexible and depends on your environment.

The documentation on installing with a [flat Kubernetes manifest](/gateway/{{page.kong_version}}/install-and-run/kubernetes) also explains how to install in DB-less mode for both Enterprise and OSS deployments.

The {{site.base_gateway}} software is governed by the
[Kong Software License Agreement](https://konghq.com/kongsoftwarelicense/).
{{site.ce_product_name}} is licensed under an
[Apache 2.0 license](https://github.com/Kong/kong/blob/master/LICENSE).

{% navtabs %}
{% navtab Kind %}
## Prerequisites for Kong on Kind

- `helm` Helm 3
- `kubectl` v1.19 or later
- `license.json` An enterprise license file from Kong
- `kind` KinD / Kubernetes-in-Docker

{% endnavtab %}
{% navtab Docker Desktop Kubernetes%}
## Prerequisites for Kong on Docker Desktop Kubernetes

- `helm` Helm 3
- `kubectl` v1.19 or later
- `license.json` An enterprise license file from Kong
- Docker Desktop Kubernetes Cluster

{% endnavtab %}
{% endnavtabs %}


{% navtabs %}
{% navtab Kind %}

## Install Kong on Kind

Start Kind Cluster listening on ports 80 and 443

```sh
cat <<EOF > /tmp/kind-config.yaml && kind create cluster --config /tmp/kind-config.yaml
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
name: kong
networking:
  apiServerAddress: "0.0.0.0"
  apiServerPort: 16443
nodes:
  - role: control-plane
    extraPortMappings:
    - listenAddress: "0.0.0.0"
      protocol: TCP
      hostPort: 80
      containerPort: 80
    - listenAddress: "0.0.0.0"
      protocol: TCP
      hostPort: 443
      containerPort: 443
EOF
```

Add Helm Repos for Kong Gateway and Cert Manager.

```sh
helm repo add kong https://charts.konghq.com
helm repo add jetstack https://charts.jetstack.io
helm repo update
```

Create the namespace for {{site.base_gateway}} with {{site.kic_product_name}}. For example:

```sh
kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -
```

Create Kong License Secret

```sh
kubectl create secret generic kong-enterprise-license -n kong --from-file=license=license.json --dry-run=client -oyaml | kubectl apply -n kong -f -
```

Create Kong Credential & Config Variables

```sh
kubectl create secret generic kong-config-secret -n kong \
    --from-literal=kong_admin_password=kong \
    --from-literal=portal_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"portal_session","cookie_samesite":"off","cookie_secure":false}' \
    --from-literal=admin_gui_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"admin_session","cookie_samesite":"off","cookie_secure":false}' \
    --from-literal=pg_host="enterprise-postgresql.kong.svc.cluster.local" \
    --from-literal=pg_port="5432" \
    --from-literal=password=kong \
    --dry-run=client -oyaml \
  | kubectl apply -f -
```

Install Cert Manager

```sh
helm upgrade --install cert-manager jetstack/cert-manager --namespace kong --set installCRDs=true
```

Deploy Kong Gateway

```sh
helm upgrade --install enterprise kong/kong --namespace kong --values ./app/gateway/2.8.x/helm/values/quickstart-enterprise.yaml
```

Clean Up

```sh
helm uninstall --namespace kong enterprise
helm uninstall --namespace kong cert-manager
rm /tmp/config.yaml
```
{% endnavtab %}
{% navtab Docker%}
## Steps for Docker go here

Add Helm Repos for Kong Gateway, Cert Manager, and Postgres.
```sh
helm repo add kong https://charts.konghq.com
helm repo add jetstack https://charts.jetstack.io
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```


Start Kind Cluster listening on ports 80 and 443
```sh
cat <<EOF > config.yaml && kind create cluster --config ./config.yaml
apiVersion: kind.x-k8s.io/v1alpha4
kind: Cluster
name: kong
networking:
  apiServerAddress: "0.0.0.0"
  apiServerPort: 16443
nodes:
  - role: control-plane
    extraPortMappings:
    - listenAddress: "0.0.0.0"
      protocol: TCP
      hostPort: 80
      containerPort: 80
    - listenAddress: "0.0.0.0"
      protocol: TCP
      hostPort: 443
      containerPort: 443
EOF
```

Create the namespace for {{site.base_gateway}} with {{site.kic_product_name}}. For example:

```sh
kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -
```

Install Cert Manager

```sh
helm upgrade --install cert-manager jetstack/cert-manager --set installCRDs=true --namespace kong
```

Bootstrap a self-signed certificate issuer.
```sh
cat <<EOF | kubectl apply -n kong -f -
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: certman-clusterissuer-selfsign-root
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: certman-cluster-root-ca-cert
spec:
  isCA: true
  commonName: certman-cluster-selfsigned-root-ca
  secretName: certman-cluster-selfsigned-root-ca
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: certman-clusterissuer-selfsign-root
    kind: ClusterIssuer
    group: cert-manager.io
  renewBefore: 360h
  duration: 2160h
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: certman-selfsigned-issuer
spec:
  ca:
    secretName: certman-cluster-selfsigned-root-ca
EOF
```

Issue Kong Certificate
```sh
cat <<EOF | kubectl apply -n kong -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: kong-tls
spec:
  secretName: kong-tls
  commonName: kong_clustering
  dnsNames:
  - "kong_clustering"
  - "*.7f000001.nip.io"
  - "*.apps.7f000001.nip.io"
  - "*.kong.7f000001.nip.io"
  renewBefore: 360h
  duration: 2160h
  isCA: false
  issuerRef:
    name: certman-selfsigned-issuer
    kind: ClusterIssuer
EOF
```

Create Kong License Secret
```sh
kubectl create secret generic kong-enterprise-license -n kong --from-file=license=license.json --dry-run=client -oyaml | kubectl apply -n kong -f -
```

Create Kong Credentials & Config Vars Secret
```sh
kubectl create secret generic kong-config-secret -n kong \
    --from-literal=admin_gui_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"admin_session","cookie_samesite":"off","cookie_secure":false}' \
    --from-literal=portal_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"portal_session","cookie_samesite":"off","cookie_secure":false}' \
    --from-literal=pg_host="postgres-postgresql.kong.svc.cluster.local" \
    --from-literal=pg_port="5432" \
    --from-literal=password=kong \
    --from-literal=database=kong \
    --from-literal=user=kong \
    --dry-run=client -oyaml \
  | kubectl apply -f -
```

Install Postgres Database (need to remove this step)
```sh
helm upgrade --install postgres bitnami/postgresql --namespace kong --set auth.database=kong --set auth.username=kong --set auth.password=kong
```

Deploy Kong Gateway
```sh
helm upgrade --install enterprise kong/kong --namespace kong --values ./app/gateway/2.8.x/helm/values/quickstart-enterprise.yaml
```

```sh
```

```sh
```

```sh
helm uninstall --namespace kong enterprise
helm uninstall --namespace kong pg
helm uninstall --namespace kong cert-manager
rm config.yaml
```
{% endnavtab %}
{% endnavtabs %}


## Conclusion for both 
See the [Kong Ingress Controller docs](/kubernetes-ingress-controller/) for  how-to guides, reference guides, and more.

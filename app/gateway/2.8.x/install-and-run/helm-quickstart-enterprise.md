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

## Install Kong

Build local Kong on Kind Kubernetes

> NOTE: This Kong on Kind deployment requires that port 80 and 443 to be available
>

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

Install Cert Manager

```sh
# Add and Update Jetstack Cert Manager Helm Repo
helm repo add jetstack https://charts.jetstack.io ; helm repo update

# Install Cert Manager
helm upgrade --install cert-manager jetstack/cert-manager \
    --set installCRDs=true --namespace kong --create-namespace

# May remove this step, it is present to prevent kong helm chart being installed before cert-manager is ready
kubectl wait --namespace kong --for=condition=complete --timeout=60s job/cert-manager-startupapicheck 2>/dev/null
```

Create the `kong` namespace for {{site.base_gateway}}.

```sh
kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -
```

Create Kong Enterprise License Secret

```sh
kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -
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

Deploy Kong Gateway

```sh
# Add and Update Kong Helm Repo
helm repo add kong https://charts.konghq.com ; helm repo update

# Workaround till Helm Chart PR#529 is Released
git clone https://github.com/kong/charts ~/kong-charts-helm-project
cd ~/kong-charts-helm-project/charts/kong
gh pr checkout 592
helm dependencies update

# Install Kong
helm upgrade --install enterprise \
  --namespace kong \
  --set proxy.type=ClusterIP \
  --values ./example-values/enterprise-licensed-quickstart.yaml \
  ./

# Wait for all pods to show ready
watch kubectl get po -nkong
```

Now open your Kong Manager Web GUI at: [https://manager.kong.7f000001.nip.io](https://manager.kong.7f000001.nip.io)

> Google Chrome may complain about untrusted certificates.  
> If there is no "Accept risk and continue" option then type `thisisunsafe` while the tab has focus to continue.  
>

Clean Up

```sh
# Remove Kong
helm uninstall --namespace kong enterprise

# Delete Kong Secrets
kubectl delete secrets -nkong kong-enterprise-license
kubectl delete secrets -nkong kong-config-secret

# Remove Kong Database PVC
kubectl delete pvc -nkong data-enterprise-postgresql-0

# Remove Kong Helm Chart Repository
helm repo remove kong

# Remove cert-manager
helm uninstall --namespace kong cert-manager

# Remove jetstack cert-manager Helm Repository
helm repo remove jetstack

# Destroy your Kind Cluster
kind delete cluster --name=kong
rm /tmp/config.yaml

# Remove Kong Helm Chart PR 592
rm -rf ~/kong-charts-helm-project
```

{% endnavtab %}
{% navtab Docker Desktop Kubernetes %}

## Prerequisites for Kong on Docker Desktop Kubernetes

- `helm` Helm 3
- `kubectl` v1.19 or later
- `license.json` An enterprise license file from Kong
- Docker Desktop Kubernetes

## Install Kong on Docker Desktop Kubernetes

Start a clean Docker Desktop Kubernetes Cluster.

Install Cert Manager

```sh
# Add and Update Jetstack Cert Manager Helm Repo
helm repo add jetstack https://charts.jetstack.io ; helm repo update

# Install Cert Manager
helm upgrade --install cert-manager jetstack/cert-manager \
    --set installCRDs=true --namespace kong --create-namespace

# May remove this step, it is present to prevent kong helm chart being installed before cert-manager is ready
kubectl wait --namespace kong --for=condition=complete --timeout=60s job/cert-manager-startupapicheck 2>/dev/null
```

Create the `kong` namespace for {{site.base_gateway}}.

```sh
kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -
```

Create Kong Enterprise License Secret

```sh
kubectl create secret generic kong-enterprise-license -n kong --from-file=license=license.json --dry-run=client -oyaml | kubectl apply -f -
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

Deploy Kong Gateway

```sh
# Add and Update Kong Helm Repo
helm repo add kong https://charts.konghq.com ; helm repo update

# Workaround till Helm Chart PR#529 is Released
git clone https://github.com/kong/charts ~/kong-charts-helm-project
cd ~/kong-charts-helm-project/charts/kong
gh pr checkout 592
helm dependencies update

helm upgrade --install enterprise \
  --namespace kong \
  --set proxy.type=LoadBalancer \
  --values ./example-values/enterprise-licensed-quickstart.yaml \
  ./

# Wait for all pods to show ready
watch kubectl get po -nkong
```

Now open your Kong Manager Web GUI at: [https://manager.kong.7f000001.nip.io](https://manager.kong.7f000001.nip.io)

> Google Chrome may complain about untrusted certificates.  
> If there is no "Accept risk and continue" option then type `thisisunsafe` while the tab has focus to continue.  
>

Clean Up

```sh
# Remove Kong
helm uninstall --namespace kong enterprise

# Delete Kong Secrets
kubectl delete secrets -nkong kong-enterprise-license
kubectl delete secrets -nkong kong-config-secret

# Remove Kong Database PVC
kubectl delete pvc -nkong data-enterprise-postgresql-0

# Remove Kong Helm Chart Repository
helm repo remove kong

# Remove cert-manager
helm uninstall --namespace kong cert-manager

# Remove jetstack cert-manager Helm Repository
helm repo remove jetstack

# Remove Kong Helm Chart PR 592
rm -rf ~/kong-charts-helm-project
```


{% endnavtab %}
{% endnavtabs %}

## Conclusion

See the [Kong Ingress Controller docs](/kubernetes-ingress-controller/) for  how-to guides, reference guides, and more.

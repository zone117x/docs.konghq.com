---
title: How to Install Kong Gateway with Helm
---

This guide will show you how to install {{site.base_gateway}} with Helm. This guide supports using [Docker Desktop Kubernetes(https://docs.docker.com/desktop/kubernetes/)], or [Kind](https://kind.sigs.k8s.io/). 
The instructions in this guide will set up a Kubernetes cluster running Kong Gateway that you will viewable using [nip.io](https://nip.io). 

The {{site.base_gateway}} software is governed by the
[Kong Software License Agreement](https://konghq.com/kongsoftwarelicense/).
{{site.ce_product_name}} is licensed under an
[Apache 2.0 license](https://github.com/Kong/kong/blob/master/LICENSE).


{% navtabs %}
{% navtab Docker Desktop Kubernetes %}

## Dependencies

- `helm` Helm 3
- `kubectl` v1.19 or later
- `license.json` An enterprise license file from Kong
- Docker Desktop Kubernetes

## Kong Gateway Dependencies

1. Startup [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

2. Add the Jetstack Cert Manager Helm Repo locally

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

3. Install Cert Manager

        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace cert-manager --create-namespace

## Kong Gateway Configuration

Next, you will create a [secret](https://kubernetes.io/docs/concepts/configuration/secret/) using the `kubectl create secret` command. 
You will also need to create a secret that contains generic credential and configuration variables. The `kubectl create secret` command packages your `license.json` file and your configuration variables into a secret object on the Kubernetes cluster. If you do not have a `license.json` file, please contact your account manager. 

2. Create Kong Namespace for {{site.base_gateway}}

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

3. Create Kong Enterprise License Secret

        kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -

4. Create Kong Config & Credential Variables

        kubectl create secret generic kong-config-secret -n kong \
            --from-literal=kong_admin_password=kong \
            --from-literal=portal_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"portal_session","cookie_samesite":"off","cookie_secure":false}' \
            --from-literal=admin_gui_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"admin_session","cookie_samesite":"off","cookie_secure":false}' \
            --from-literal=pg_host="enterprise-postgresql.kong.svc.cluster.local" \
            --from-literal=pg_port="5432" \
            --from-literal=password=kong \
            --dry-run=client -oyaml \
          | kubectl apply -f -

## Kong Gateway Deployment

{:.note}
> THIS IS A TEMPORARY DEVELOPMENT STEP  
> Clone and checkout the kong charts cert-manager enhancement pull request

        # this requires gh cli https://cli.github.com/manual/installation
        git clone https://github.com/kong/charts ~/kong-charts-helm-project
        cd ~/kong-charts-helm-project/charts/kong
        gh pr checkout 592
        helm dependencies update

1. Add the Kong Helm Repo

        helm repo add kong https://charts.konghq.com ; helm repo update

2. Install Kong

        helm upgrade --install quickstart --namespace kong \
          --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
          ./


3. Now open the local Kong Manager Web Application in your browser at
[https://kong.7f000001.nip.io](https://kong.7f000001.nip.io)

You can also call the Kong Admin API with insomnia, httpie, or curl, at [https://kong.7f000001.nip.io/api](https://kong.7f000001.nip.io/api)

{:.note}
> In Chrome you may receive a warning "Your Connection is not Private" message.  
> If there is no "Accept risk and continue" option then type `thisisunsafe` while the in the tab to continue.

<!---
### Clean Up

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
### Clean Up

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
---> 


{% endnavtab %}
{% navtab Kind %}

# Install Kong Gateway with Kind

Kind stands for Kubernetes In Docker, and is a tool for running local Kubernetes clusters using Docker Containers. We will be using Kind to deploy the clusters and Helm to install Kong Gateway. 
## Local Dependencies

- [`Helm 3`](https://helm.sh/)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) v1.19 or later
- A `license.json` enterprise license file from Kong
- [KinD](https://kind.sigs.k8s.io/)
- Open port 80, and 443. 

## Kong Gateway Dependencies

1. Startup [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

2. Add the Jetstack Cert Manager Helm Repo locally

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

3. Install Cert Manager

        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace cert-manager --create-namespace

## Kong Gateway Configuration

Next, you will create a [secret](https://kubernetes.io/docs/concepts/configuration/secret/) using the `kubectl create secret` command. 
You will also need to create a secret that contains generic credential and configuration variables. The `kubectl create secret` command packages your `license.json` file and your configuration variables into a secret object on the Kubernetes cluster. If you do not have a `license.json` file, please contact your account manager. 

2. Create Kong Namespace for {{site.base_gateway}}

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

3. Create Kong Enterprise License Secret

        kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -

4. Create Kong Config & Credential Variables

        kubectl create secret generic kong-config-secret -n kong \
            --from-literal=kong_admin_password=kong \
            --from-literal=portal_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"portal_session","cookie_samesite":"off","cookie_secure":false}' \
            --from-literal=admin_gui_session_conf='{"storage":"kong","secret":"CHANGEME-secret-salt","cookie_name":"admin_session","cookie_samesite":"off","cookie_secure":false}' \
            --from-literal=pg_host="enterprise-postgresql.kong.svc.cluster.local" \
            --from-literal=pg_port="5432" \
            --from-literal=password=kong \
            --dry-run=client -oyaml \
          | kubectl apply -f -

## Kong Gateway Deployment

{:.note}
> THIS IS A TEMPORARY DEVELOPMENT STEP  
> Clone and checkout the kong charts cert-manager enhancement pull request

        # this requires gh cli https://cli.github.com/manual/installation
        git clone https://github.com/kong/charts ~/kong-charts-helm-project
        cd ~/kong-charts-helm-project/charts/kong
        gh pr checkout 592
        helm dependencies update

1. Add the Kong Helm Repo

        helm repo add kong https://charts.konghq.com ; helm repo update

2. Install Kong

        helm upgrade --install quickstart \
          --namespace kong \
          --set proxy.type=ClusterIP \
          --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
          ./


3. Now open the local Kong Manager Web Application in your browser at
[https://kong.7f000001.nip.io](https://kong.7f000001.nip.io)

You can also call the Kong Admin API with insomnia, httpie, or curl, at [https://kong.7f000001.nip.io/api](https://kong.7f000001.nip.io/api)

{:.note}
> In Chrome you may receive a warning "Your Connection is not Private" message.  
> If there is no "Accept risk and continue" option then type `thisisunsafe` while the in the tab to continue.

<!---
### Clean Up

```sh
# Remove Kong
helm uninstall --namespace kong quickstart

# Delete Kong Secrets
kubectl delete secrets -nkong kong-enterprise-license
kubectl delete secrets -nkong kong-config-secret

# Remove Kong Database PVC
kubectl delete pvc -nkong data-quickstart-postgresql-0

# Remove Kong Helm Chart Repository
helm repo remove kong

# Remove cert-manager
helm uninstall --namespace kong cert-manager

# Remove jetstack cert-manager Helm Repository
helm repo remove jetstack

# Destroy your Kind Cluster
kind delete cluster --name=kong
rm /tmp/kind-config.yaml

# Remove Kong Helm Chart PR 592
rm -rf ~/kong-charts-helm-project
```
---> 

{% endnavtab %}
{% endnavtabs %}

## Conclusion

See the [Kong Ingress Controller docs](/kubernetes-ingress-controller/) for  how-to guides, reference guides, and more.

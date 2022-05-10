---
title: How to Install Kong Gateway with Helm
toc: false
---

This guide will show you how to install {{site.base_gateway}} with Helm. This guide supports using [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/), or [Kind](https://kind.sigs.k8s.io/). 
The instructions in this guide will set up a Kubernetes cluster running Kong Gateway that you will viewable using [nip.io](https://nip.io). 

The {{site.base_gateway}} software is governed by the
[Kong Software License Agreement](https://konghq.com/kongsoftwarelicense/).
{{site.ce_product_name}} is licensed under an
[Apache 2.0 license](https://github.com/Kong/kong/blob/master/LICENSE).


{% navtabs %}
{% navtab Docker Desktop Kubernetes %}
# Install Kong Gateway with Docker Desktop
## Prerequisites 

- [`Helm 3`](https://helm.sh/)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) v1.19 or later
- A `license.json` enterprise license file from Kong
- [Docker Desktop](https://docs.docker.com/desktop/#download-and-install) with Kubernetes enabled. 


## Install Dependencies
With Docker Desktop you can enable a standalone Kubernetes server from the Docker application. In this guide, you will be using Docker Desktop to quickly deploy a Kong Gateway Kubernetes cluster. Docker Desktop does not enable Kubernetes functionality by default. To enable Docker Desktop Kubernetes, open the Docker application on your local machine. Click the **Settings Cog** in the top-right corner of the application to open **Preferences**. From the **Preferences** menu, click the Kubernetes option, and tick **Enable Kubernetes**.

With Docker Desktop Kubernetes enabled, you can now install dependencies: 

1. Add the Jetstack Cert Manager Helm Repo locally

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

2. Install Cert Manager

        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace cert-manager --create-namespace

## Configure Kong Gateway

Next, you will create a [secret](https://kubernetes.io/docs/concepts/configuration/secret/) using the `kubectl create secret` command. 
You will also need to create a secret that contains generic credential and configuration variables. The `kubectl create secret` command packages your `license.json` file and your configuration variables into a secret object on the Kubernetes cluster. If you do not have a `license.json` file, please contact your account manager. 

2. Create Kong Namespace for {{site.base_gateway}}

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

3. Create Kong Enterprise License Secret

        kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -    
      >These instructions must be run in the directory that contains your `license.json` file. 

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

## Deploy Kong Gateway

{:.important}
> The following 4 steps are temporary development steps and will be removed from the guide.
> These steps are required to access the helm-chart before it is merged into production.

1. `git clone https://github.com/kong/charts ~/kong-charts-helm-project` 
2. `cd ~/kong-charts-helm-project/charts/kong`
3. `git pull https://github.com/usrbinkat/kong-charts-feat-cert-manager.git feature-proxy-and-mtls-with-certmanager`
4. `helm dependencies update`

Once all of the dependencies are installed, Deploy Kong Gateway:

1. Add the Kong Helm Repo

        helm repo add kong https://charts.konghq.com ; helm repo update

2. Install Kong

        helm upgrade --install quickstart --namespace kong \
          --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
          ./


3. Now open the local Kong Manager Web Application in your browser at
[https://kong.7f000001.nip.io](https://kong.7f000001.nip.io)

    {:.note}
    > In Chrome you may receive a warning "Your Connection is not Private" message.  
    > If there is no "Accept risk and continue" option then type `thisisunsafe` while the in the tab to continue.


You can use the Kong Admin API with insomnia, httpie, or cURL, at [https://kong.7f000001.nip.io/api](https://kong.7f000001.nip.io/api)

{% navtabs codeblock %}
{% navtab cURL %}
```sh
curl --insecure -i -X GET https://kong.7f000001.nip.io/api
```
{% endnavtab %}
{% navtab HTTPie %}
```sh
http --verify=no get https://kong.7f000001.nip.io/api
```
{% endnavtab %}
{% endnavtabs %}


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
## Prerequisites

- [`Helm 3`](https://helm.sh/)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) v1.19 or later
- A `license.json` enterprise license file from Kong
- [KinD](https://kind.sigs.k8s.io/)
- Open port 80, and 443. 

## Install Dependencies

1. Startup [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/)

2. Add the Jetstack Cert Manager Helm Repo locally

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

3. Install Cert Manager

        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace cert-manager --create-namespace

## Configure Kong Gateway

Next, create a [secret](https://kubernetes.io/docs/concepts/configuration/secret/) using the `kubectl create secret` command. 
You also need to create a secret that contains generic credential and configuration variables. The `kubectl create secret` command packages your `license.json` file and your configuration variables into a secret object on the Kubernetes cluster. If you do not have a `license.json` file, please contact your account manager. 

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

## Deploy Kong Gateway

{:.important}
> The following 4 steps are temporary development steps and will be removed from the guide.
> These steps are required to access the helm-chart before it is merged into production.

1. `git clone https://github.com/kong/charts ~/kong-charts-helm-project` 
2. `cd ~/kong-charts-helm-project/charts/kong`
3. `git pull https://github.com/usrbinkat/kong-charts-feat-cert-manager.git feature-proxy-and-mtls-with-certmanager`
4. `helm dependencies update`

Once all of the dependencies are installed, Deploy Kong Gateway:

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

    {:.note}
    > In Chrome you may receive a warning "Your Connection is not Private" message.  
    > If there is no "Accept risk and continue" option then type `thisisunsafe` while the in the tab to continue.


You can use the Kong Admin API with insomnia, httpie, or cURL, at [https://kong.7f000001.nip.io/api](https://kong.7f000001.nip.io/api)

{% navtabs codeblock %}
{% navtab cURL %}
```sh
curl --insecure -i -X GET https://kong.7f000001.nip.io/api
```
{% endnavtab %}
{% navtab HTTPie %}
```sh
http --verify=no get https://kong.7f000001.nip.io/api
```
{% endnavtab %}
{% endnavtabs %}



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

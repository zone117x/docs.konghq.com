---
title: How to Install Kong Gateway with Helm
toc: false
---

This guide shows you how to deploy {{site.base_gateway}} with Helm on your local environment. These steps are known to work on [Docker Desktop Kubernetes](https://docs.docker.com/desktop/kubernetes/) and [Kind](https://kind.sigs.k8s.io/).
Once deployed, Kong will be locally accessible at `https://kong.7f000001.nip.io`. We are using [nip.io](https://nip.io) to automatically resolve this domain to localhost. 

The {{site.base_gateway}} software is governed by the
[Kong Software License Agreement](https://konghq.com/kongsoftwarelicense/).
{{site.ce_product_name}} is licensed under an
[Apache 2.0 license](https://github.com/Kong/kong/blob/master/LICENSE).


{% navtabs %}
{% navtab Docker Desktop Kubernetes %}
## Install Kong Gateway on Docker Desktop
## Prerequisites 

- [`Helm 3`](https://helm.sh/)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) v1.19 or later
- A `license.json` enterprise license file from Kong
- [Docker Desktop](https://docs.docker.com/desktop/#download-and-install) with Kubernetes enabled. 


## Install Dependencies

Docker Desktop does not enable Kubernetes functionality automatically. To enable Docker Desktop Kubernetes, open the Docker application on your local machine, click the **Settings Cog** in the top-right corner of the application to open **Preferences**. From the **Preferences** menu, click the Kubernetes option, and **Enable Kubernetes**.

Once Docker Desktop Kubernetes is ready, let's install dependencies: 

1. Add the Jetstack Cert Manager Helm repository:

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

2. Install Cert Manager:
        
        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace cert-manager --create-namespace

## Configure Kong Gateway

Configuring Kong Gateway requires a Namespace and configuration Secrets. Our secrets will contain Kong's enterprise license, admin password, session configurations, and Postgres connection details. If you do not have a `license.json` file, please contact your account manager.

2. Create Kong Namespace for {{site.base_gateway}}:

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

3. Create Kong Enterprise License Secret:

        kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -    
      
      >These instructions must be run in the directory that contains your `license.json` file. 

4. Create Kong config & credential variables:

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

Once all dependencies are installed and ready, deploy Kong Gateway to your cluster:

1. Add the Kong Helm Repo:

        helm repo add kong https://charts.konghq.com ; helm repo update

2. Install Kong:

        helm upgrade --install quickstart --namespace kong \
          --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
          ./


3. Open the Kong Manager in your browser at [https://kong.7f000001.nip.io](https://kong.7f000001.nip.io). 

4. Log in with the default username and password combination: `kong_admin`:`kong`

    {:.note}
    > In Chrome you may receive a "Your Connection is not Private" warning message.  
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

## Install Kong Gateway with Kind

Kind or Kubernetes-in-Docker, is a tool for running local Kubernetes clusters in Docker Containers. In this guide you can deploy a Kind Kubernetes cluster and then use Helm to install Kong Enterprise Gateway. 
## Prerequisites

- [`Helm 3`](https://helm.sh/)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) v1.19 or later
- A `license.json` enterprise license file from Kong
- [KinD](https://kind.sigs.k8s.io/)
- Ports 80 and 443 available

## Create Kubernetes Cluster

To build a local Kubernetes Cluster you have to create a YAML file that contains details about your cluster. Starting from the cat command, and ending with EOF, highlight and copy this entire text block, then paste it into your terminal.

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

Verify that the cluster was installed using `kind get clusters`.  This command will return `kong` if the installation was successful. 

## Install Dependencies

1. Add the Jetstack Cert Manager Helm Repo:

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

2. Install Cert Manager:

        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace cert-manager --create-namespace

## Configure Kong Gateway

Configuring Kong Gateway requires a Namespace and configuration Secrets. Our secrets will contain Kong's enterprise license, admin password, session configurations, and Postgres connection details. If you do not have a `license.json` file, please contact your account manager.

1. Create a Namespace for {{site.base_gateway}}:

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

2. Create Kong Enterprise License Secret:

        kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -
        
    >These instructions must be run in the directory that contains your `license.json` file. 

3. Create Kong config & credential variables:

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

Once all dependencies are installed and ready, deploy Kong Gateway to your cluster:

1. Add the Kong Helm Repo:

        helm repo add kong https://charts.konghq.com ; helm repo update

2. Install Kong:

        helm upgrade --install quickstart \
          --namespace kong \
          --set proxy.type=ClusterIP \
          --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
          ./


3. Open the Kong Manager in your browser at [https://kong.7f000001.nip.io](https://kong.7f000001.nip.io). 

4. Log in with the default username and password combination: `kong_admin`:`kong`

    {:.note}
    > In Chrome you may receive a "Your Connection is not Private" warning message.  
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

You can use the Kong Admin API with Insomnia, HTTPie, or cURL, at [https://kong.7f000001.nip.io/api](https://kong.7f000001.nip.io/api)

{% navtabs codeblock %}
{% navtab cURL %}
```sh
curl --insecure -i -X GET https://kong.7f000001.nip.io/api -H 'kong-admin-token:kong'
```
{% endnavtab %}
{% navtab HTTPie %}
```sh
http --verify=no get https://kong.7f000001.nip.io/api kong-admin-token:kong_admin
```
{% endnavtab %}
{% endnavtabs %}


## Conclusion

See the [Kong Ingress Controller docs](/kubernetes-ingress-controller/) for  how-to guides, reference guides, and more.

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
{% navtab Kind %}

# Install Kong Gateway with Kind

Kind stands for Kubernetes In Docker, and is a tool for running local Kubernetes clusters using Docker Containers. We will be using Kind to deploy the clusters and Helm to install Kong Gateway. 
## Prerequisites

- [`Helm 3`](https://helm.sh/)
- [`kubectl`](https://kubernetes.io/docs/tasks/tools/) v1.19 or later
- A `license.json` enterprise license file from Kong
- [KinD](https://kind.sigs.k8s.io/)
- Open port 80, and 443. 

## Create cluster

To build a local Kubernetes Cluster you have to create a YAML configuration file that contains details about your cluster. Starting from the `cat` command, and ending with `EOF` highlight and copy this entire code block, then paste it into your terminal.

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

This creates a configuration file and a cluster based on the configuration file that is running nodes on port `80` and `443`. 
## Configure Cluster

1. Create Kong Namespace for {{site.base_gateway}}

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

2. Add and Update Jetstack Cert Manager Helm Repo

        helm repo add jetstack https://charts.jetstack.io ; helm repo update

3. Install Cert Manager

        helm upgrade --install cert-manager jetstack/cert-manager \
            --set installCRDs=true --namespace kong --create-namespace


### Credentials and Configuration Variables

Next, you will create a [secret](https://kubernetes.io/docs/concepts/configuration/secret/) using the `kubectl create secret` command. 
You will also need to create a secret that contains generic credential and configuration variables. The `kubectl create secret` command packages your `license.json` file and your configuration variables into a secret object on the Kubernetes cluster. If you do not have a `license.json` file, please contact your account manager. 



1. Create Kong Namespace for {{site.base_gateway}}

        kubectl create namespace kong --dry-run=client -oyaml | kubectl apply -f -

1. Create Kong Enterprise License Secret

        kubectl create secret generic kong-enterprise-license --from-file=license=license.json -n kong --dry-run=client -oyaml | kubectl apply -f -

2. Create Kong Credential & Config Variables

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


## Deploy Kong Gateway


1. Add and Update Kong Helm Repo

        helm repo add kong https://charts.konghq.com ; helm repo update

2. WORKAROUND: Clone the Kong charts repo, checkout Kat's PR, and run `helm dependencies update`

        # THIS REQUIRES THE gh cli https://cli.github.com/manual/installation
        git clone https://github.com/kong/charts kong-charts-helm-project
        cd ~/kong-charts-helm-project/charts/kong
        gh pr checkout 592
        helm dependencies update

3. (Actual step 2) Install Kong


        helm upgrade --install quickstart \
          --namespace kong \
          --set proxy.type=ClusterIP \
          --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
          ./


4. Open the Kong Manager Web Application by navigating to the following URL:
[https://kong.7f000001.nip.io](https://kong.7f000001.nip.io)

5. You can also reach the Kong Admin API with curl, httpie, or insomnia at: [https://kong.7f000001.nip.io/api](https://kong.7f000001.nip.io/api)

{:.note}
> In Chrome you will receive a "Your Connection is not Private" message.  
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

helm upgrade --install quickstart \
  --namespace kong \
  --set proxy.type=LoadBalancer \
  --values ./example-values/quickstart-enterprise-licensed-aio.yaml \
  ./


```

Now open your Kong Manager Web GUI at: [https://kong.7f000001.nip.io](https://kong.7f000001.nip.io)

> Google Chrome may complain about untrusted certificates. If there is no "Accept risk and continue" option, type `thisisunsafe` in the tab to continue.  




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


{% endnavtab %}
{% endnavtabs %}

## Conclusion

See the [Kong Ingress Controller docs](/kubernetes-ingress-controller/) for  how-to guides, reference guides, and more.

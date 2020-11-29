apiVersion: v1
kind: Secret
metadata:
  name: google-credentials
  namespace: $NAMESPACE
type: Opaque
data:
  google_credentials.json: $SERVICE_ACCOUNT
---
apiVersion: v1
data:
  CLUSTER_ID: $CUSTOMER_CLUSTER_ID 
  GIT_USER: $GIT_USER
  GIT_USER_PASS: $GIT_PASS
  GITEA_ACCESS_TOKEN: $GITEA_ACCESS_TOKEN
  GITEA_BASE_URL: $GITEA_BASE_URL
  GITEA_SSH_IP: $GITEA_SSH_IP
  GITEA_SSH_PORT: $GITEA_SSH_PORT
  GOOGLE_APPLICATION_CREDENTIALS: L2V0Yy9nY3AvZ29vZ2xlX2NyZWRlbnRpYWxzLmpzb24=
  HASURA_CLOUD_URI: $HASURA_CLOUD_URI 
  KUBERNETES_ZONE: $CUSTOMER_CLUSTER_ZONE
  PASSWORD_SALT: $PASSWORD_SALT
  PROJECT_ID: $CUSTOMER_CLUSTER_PROJECT_ID 
  TOKEN_SALT: $TOKEN_SALT
  DEPLOYMENT_BASE_DOMAIN: $DEPLOYMENT_BASE_DOMAIN
  CLOUDBUILD_TRIGGER_NAME: $CLOUDBUILD_TRIGGER_NAME
  CLIENT_ID: $CLIENT_ID
  CLIENT_SECRET: $CLIENT_SECRET
  AUTH_API_URL: $AUTH_API_URL
  AUDIENCE: $AUDIENCE
  AUTH_GITHUB_TOKEN: $AUTH_GITHUB_TOKEN
  HASURA_ACCESS_KEY: $HASURA_ACCESS_KEY
  AUTH_API_TOKEN: $AUTH_API_TOKEN
kind: Secret
type: Opaque
metadata:
  name: api-config
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    run: api
  name: api
  namespace: $NAMESPACE
spec:
  replicas: 1
  selector:
    matchLabels:
      run: api
  strategy:
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 25%
    type: RollingUpdate
  template:
    metadata:
      labels:
        run: api
    spec:
      volumes:
      - name: google-credentials
        secret:
          secretName: google-credentials
          items:
             - key: google_credentials.json
               path: google_credentials.json
               mode: 0777
      containers:
      - image: $IMAGE
        lifecycle:
          postStart:
            exec:
              command:
              - /bin/sh
              - -c
              - mkdir /etc/gcp && cp /data/gcp/* /etc/gcp/ && chmod -R 777 /etc/gcp/*

        imagePullPolicy: IfNotPresent
        envFrom:
        - secretRef:
            name: api-config
        name: api
        volumeMounts:
        - name: google-credentials
          mountPath: /data/gcp
        resources: {}
        terminationMessagePath: /dev/termination-log
        terminationMessagePolicy: File
      dnsPolicy: ClusterFirst
      restartPolicy: Always
      schedulerName: default-scheduler
      securityContext: {}
      terminationGracePeriodSeconds: 30
---
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    kubernetes.io/ingress.class: nginx
  name: api-ingress
  namespace: $NAMESPACE
spec:
  rules:
  - host: $HOSTNAME
    http:
      paths:
      - backend:
          serviceName: api
          servicePort: 9090
        path: /
  tls:
  - hosts:
    - $HOSTNAME
    secretName: api.tls
---
apiVersion: v1
kind: Service
metadata:
  labels:
    run: api
  name: api
  namespace: $NAMESPACE
spec:
  ports:
  - port: 9090
    protocol: TCP
    targetPort: 9090
  selector:
    run: api
  sessionAffinity: None
  type: ClusterIP

@echo off
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy amenguide-backend --image gcr.io/amenguide/amenguide-backend --platform managed --region us-west1 --project amenguide --allow-unauthenticated

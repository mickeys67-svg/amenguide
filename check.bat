@echo off
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services describe amenguide-backend --platform managed --region us-west1 --project amenguide --format "value(status.latestReadyRevisionName)"

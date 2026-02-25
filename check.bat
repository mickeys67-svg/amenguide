@echo off
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run services describe amenguide-git --platform managed --region us-west1 --project amenguide --format "value(status.url,status.latestCreatedRevisionName)"

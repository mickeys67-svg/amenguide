@echo off
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy amenguide-git --image gcr.io/amenguide/amenguide-git --platform managed --region us-west1 --project amenguide

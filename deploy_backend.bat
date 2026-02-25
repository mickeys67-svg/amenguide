@echo off
pushd E:\amenguide\backend
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit --tag gcr.io/amenguide/amenguide-backend --project amenguide
if %errorlevel% neq 0 exit /b %errorlevel%
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy amenguide-backend --image gcr.io/amenguide/amenguide-backend --platform managed --region us-west1 --project amenguide --allow-unauthenticated
popd

@echo off
pushd E:\amenguide\frontend
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit --tag gcr.io/amenguide/amenguide-git --project amenguide
if %errorlevel% neq 0 exit /b %errorlevel%
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy amenguide-git --image gcr.io/amenguide/amenguide-git --platform managed --region us-west1 --project amenguide
popd

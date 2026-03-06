@echo off
pushd E:\amenguide\backend
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" builds submit --tag gcr.io/amenguide/amenguide-backend --project amenguide
if %errorlevel% neq 0 exit /b %errorlevel%
"C:\Users\micke\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy amenguide-backend --image gcr.io/amenguide/amenguide-backend --platform managed --region us-west1 --project amenguide --allow-unauthenticated --update-env-vars "VAPID_PUBLIC_KEY=BN5LP9txZsbzgTaC33YGP-tQyYZinOfxo3EzqXFAEGJa6qsZiWGMDeptqm7JliJK_frCqZCTAPjh7HvGge50d58,VAPID_PRIVATE_KEY=Dx4zQ83sXXalfq6hI5g6KzcKrPYJVyDOhUQNfy0f9SA,VAPID_EMAIL=mickeys67@gmail.com,ADMIN_EMAIL=admin@amenguide.kr"
popd

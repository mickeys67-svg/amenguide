@echo off
cd /d E:\amenguide\backend
node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});c.connect().then(()=>c.query(\"SELECT indexname FROM pg_indexes WHERE tablename='Event'\")).then(r=>{r.rows.forEach(row=>console.log(row.indexname));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"

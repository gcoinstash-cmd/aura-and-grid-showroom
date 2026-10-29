# GF-T3-228 Air-Gapped & Cloud Run Deployment Guide

## 1. Reproducible Container Build
```bash
docker build -t gf-t3-228:3.2.8 .
docker run -p 8080:8080 gf-t3-228:3.2.8
```

## 2. Air-Gapped Environment Provisioning
1. Export the verified OCI image archive:
   ```bash
   docker save gf-t3-228:3.2.8 -o gf-t3-228-airgap.tar
   ```
2. Transfer `gf-t3-228-airgap.tar` and `supabase_schema.sql` across the hardware diode.
3. Load the image on the target cluster node and apply the PostgreSQL partitioned schema:
   ```bash
   docker load -i gf-t3-228-airgap.tar
   psql -f supabase_schema.sql
   ```

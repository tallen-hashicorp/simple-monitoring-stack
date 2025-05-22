# simple-monitoring-stack
Just a simple monitoring stack

## To Run

```bash
kubectl apply -f k8s/
```

## To access

**Grafana**
```bash
kubectl -n monitoring port-forward services/grafana-service 3000:3000
```

**Prometheus**
```bash
kubectl -n monitoring port-forward services/prometheus-service 9090:9090
```

**PushGateway**
```bash
kubectl -n monitoring port-forward services/pushgateway 9091:9091
```

**Loki**
```bash
kubectl -n monitoring port-forward services/loki 3100:3100
```

## Using the Gauge in Grafana
Push your data to the Pushgateway like this:
```bash
echo "tickets_raised 3" | curl --data-binary @- http://127.0.0.1:9091/metrics/job/tickets_raised
```
Add Prometheus as a data source in Grafana, then create a gauge panel and use gauge_value as the metric.

## To Delete
```bash
kubectl delete -f k8s
```

---

## Manually process NGINX logs to loki

```bash
node loki-import/app.js nginx-access.log
```

## CLI Log Analysis with awk, pv, sort, uniq

Analyze an Nginx-style access log using simple shell commands:

### Count by HTTP Status Code
```bash
pv nginx-access.log | awk '{print $9}' | sort | uniq -c | sort -nr
```

### Count by HTTP Method
```bash
pv nginx-access.log | awk -F'"' '{print $2}' | awk '{print $1}' | sort | uniq -c | sort -nr
```

### Count by IP Address
```bash
pv nginx-access.log | awk '{print $1}' | sort | uniq -c | sort -nr
```

### Count by User-Agent
```bash
pv nginx-access.log | awk -F'"' '{print $6}' | sort | uniq -c | sort -nr
```

💡 Tip: Use head -n 10 at the end of any pipeline to show only the top 10 results.

---
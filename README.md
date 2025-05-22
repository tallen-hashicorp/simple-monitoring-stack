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
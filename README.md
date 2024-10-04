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

**

## Using the Gauge in Grafana
Push your data to the Pushgateway like this:
```bash
echo "gauge_value 42" | curl --data-binary @- http://<Pushgateway NodePort IP>:9091/metrics/job/gauge_example
```
Add Prometheus as a data source in Grafana, then create a gauge panel and use gauge_value as the metric.

## To Delete
```bash
kubectl delete -f k8s
```
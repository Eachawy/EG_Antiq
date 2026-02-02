# Monitoring Stack - Prometheus & Grafana

This directory contains the monitoring configuration for the Kemetra production stack.

## Components

- **Prometheus**: Time-series database for metrics collection
- **Grafana**: Visualization and dashboard platform
- **Node Exporter**: System-level metrics collector
- **Alert Rules**: Predefined alerting rules for critical events

## Prometheus Configuration

### Scrape Targets

The Prometheus configuration (`prometheus.yml`) defines the following scrape targets:

1. **Prometheus itself** - Self-monitoring
2. **Node Exporter** - System metrics (CPU, memory, disk)
3. **API Service** - Application metrics from `/metrics` endpoint
4. **Portal Service** - Frontend metrics (if implemented)

### Adding API Metrics Endpoint

To enable Prometheus metrics in the NestJS API, install the required packages:

```bash
cd apps/api
pnpm add @willsoto/nestjs-prometheus prom-client
```

Then add to `apps/api/src/app.module.ts`:

```typescript
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### Alert Rules

Alert rules are defined in `prometheus/alerts.yml`. Current alerts include:

- API/Portal service down
- High error rates
- High response times
- System resource warnings (CPU, memory, disk)

## Grafana Configuration

### Datasources

The Prometheus datasource is automatically provisioned via `grafana/datasources.yml`.

### Dashboards

Dashboard configuration is in `grafana/dashboards/`. You can:

1. Add pre-built dashboard JSON files here
2. Import dashboards from [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)
3. Create custom dashboards in the UI (they'll be saved to the `grafana_data` volume)

### Recommended Dashboards

Import these dashboard IDs from Grafana:

- **1860**: Node Exporter Full (system metrics)
- **11074**: Node Exporter for Prometheus Dashboard
- **3662**: Prometheus 2.0 Overview
- **13639**: Docker Container & Host Metrics

## Accessing the Monitoring Stack

### Local Access

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090 (exposed only for debugging)

Default Grafana credentials:
- Username: Set in `.env.production` (`GRAFANA_ADMIN_USER`)
- Password: Set in `.env.production` (`GRAFANA_ADMIN_PASSWORD`)

### Production Access (Optional)

Add nginx configuration to expose Grafana on a subdomain:

```nginx
# monitoring.kemetra.org
server {
    listen 443 ssl http2;
    server_name monitoring.kemetra.org;

    location / {
        proxy_pass http://grafana:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Alerting

Currently, alerts are evaluated but not sent anywhere. To enable alert notifications:

1. Configure Alertmanager (add service to docker-compose)
2. Or use Grafana's built-in alerting (Grafana v8+)
3. Configure notification channels (email, Slack, PagerDuty, etc.)

### Setting Up Grafana Alerts

1. Access Grafana UI
2. Go to Alerting → Contact points
3. Add notification channels (email, Slack, etc.)
4. Create alert rules based on Prometheus queries

## Metrics Retention

- **Prometheus**: 30 days (configurable in docker-compose `--storage.tsdb.retention.time`)
- **Grafana**: No time limit (dashboards and settings persist in `grafana_data` volume)

## Troubleshooting

### Prometheus not scraping targets

1. Check if services are running: `docker compose -f docker-compose.prod.yml ps`
2. Verify prometheus config: `docker compose -f docker-compose.prod.yml exec prometheus promtool check config /etc/prometheus/prometheus.yml`
3. View Prometheus targets: http://localhost:9090/targets

### Grafana not showing data

1. Check datasource connection: Configuration → Data sources → Prometheus → Test
2. Verify Prometheus is collecting data: http://localhost:9090/graph
3. Check Grafana logs: `docker compose -f docker-compose.prod.yml logs grafana`

### High resource usage

- Reduce scrape frequency in `prometheus.yml`
- Decrease retention time: `--storage.tsdb.retention.time=15d`
- Limit node-exporter collectors if not needed

## Security Considerations

1. **Restrict Prometheus metrics endpoint**: Add authentication or IP whitelisting in nginx
2. **Secure Grafana**: Use strong passwords, enable HTTPS
3. **Network isolation**: Keep monitoring on separate docker network
4. **Read-only access**: Configure Grafana users with viewer role by default

## Backup

Grafana dashboards and settings are stored in the `grafana_data` volume. To backup:

```bash
docker run --rm -v kemetra_grafana_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/grafana-backup.tar.gz -C /data .
```

To restore:

```bash
docker run --rm -v kemetra_grafana_data:/data -v $(pwd):/backup alpine \
  tar xzf /backup/grafana-backup.tar.gz -C /data
```

# UThynk Analytics Warehouse

## Objective
Separate transactional workloads from analytics workloads.

## Recommended Stack
- BigQuery
- Snowflake
- ClickHouse
- Kafka ingestion

## Core Event Tables
### reasoning_events
- user_id
- cohort_id
- reasoning_score
- challenge_category
- latency_ms
- created_at

### engagement_events
- session_length
- streak
- xp_earned
- feature_used
- created_at

### enterprise_events
- organization_id
- cohort_id
- active_members
- average_reasoning
- engagement_rate

## Pipelines
- API telemetry ingestion
- Queue-based ETL
- Real-time stream aggregation
- AI latency tracking

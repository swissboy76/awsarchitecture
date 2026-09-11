export const questions = [
  { id: 'root_mfa', category: 'security', weight: 5, text: 'Is MFA enabled on the AWS account root user?', help: 'Root credentials should be tightly protected and rarely used.' },
  { id: 'iam_sso', category: 'security', weight: 4, text: 'Do administrators use federated SSO / IAM Identity Center instead of long-lived IAM users?', help: 'Federation reduces credential sprawl and improves lifecycle management.' },
  { id: 'cloudtrail', category: 'security', weight: 4, text: 'Is CloudTrail enabled across all relevant accounts and regions with protected central logging?', help: 'Central audit logging is a core detective control.' },
  { id: 'guardduty', category: 'security', weight: 3, text: 'Is GuardDuty enabled and actively monitored?', help: 'GuardDuty provides managed threat detection across AWS telemetry.' },
  { id: 'encryption', category: 'security', weight: 3, text: 'Are sensitive data stores encrypted at rest and in transit by policy?', help: 'Encryption should be systematic rather than workload-by-workload.' },
  { id: 'multi_az', category: 'reliability', weight: 5, text: 'Are production workloads designed to tolerate the loss of an Availability Zone?', help: 'Critical services should avoid single-AZ dependency.' },
  { id: 'backups', category: 'reliability', weight: 5, text: 'Are backups centrally managed, monitored and periodically restore-tested?', help: 'A backup that has not been restore-tested is an assumption, not a recovery capability.' },
  { id: 'rto_rpo', category: 'reliability', weight: 5, text: 'Are RTO and RPO targets formally defined for critical services?', help: 'Recovery architecture should be driven by explicit business objectives.' },
  { id: 'health_checks', category: 'reliability', weight: 3, text: 'Are health checks, alarms and automated recovery actions defined for critical services?', help: 'Detection and recovery speed materially affect availability.' },
  { id: 'budgets', category: 'cost', weight: 4, text: 'Do you use AWS Budgets and/or cost anomaly detection with accountable owners?', help: 'Cost controls should identify unexpected spend quickly.' },
  { id: 'rightsizing', category: 'cost', weight: 5, text: 'Are compute and database workloads reviewed regularly for right-sizing and idle resources?', help: 'Right-sizing is one of the most repeatable AWS savings levers.' },
  { id: 'commitments', category: 'cost', weight: 3, text: 'Are Savings Plans / Reserved Instances reviewed against stable baseline usage?', help: 'Commitments can reduce cost where usage is predictable.' },
  { id: 'tagging', category: 'cost', weight: 3, text: 'Is there an enforced tagging strategy for cost allocation and ownership?', help: 'Unallocated spend is difficult to govern.' },
  { id: 'iac', category: 'operations', weight: 5, text: 'Is production infrastructure predominantly managed as code?', help: 'Infrastructure as code improves repeatability, reviewability and recovery.' },
  { id: 'patching', category: 'operations', weight: 4, text: 'Are patching and vulnerability remediation processes automated and measured?', help: 'Operational controls should be measurable and repeatable.' },
  { id: 'observability', category: 'operations', weight: 4, text: 'Do teams have centralised logs, metrics, alerts and service dashboards?', help: 'Observability should support rapid diagnosis rather than simply collect telemetry.' },
  { id: 'incident', category: 'operations', weight: 3, text: 'Is there a documented and exercised incident response process?', help: 'Practice materially improves response quality during real incidents.' },
  { id: 'performance_testing', category: 'performance', weight: 4, text: 'Are performance and load characteristics tested against expected peaks?', help: 'Capacity assumptions should be validated before demand reaches production.' },
  { id: 'managed_services', category: 'performance', weight: 3, text: 'Do architectures favour managed services and elastic scaling where appropriate?', help: 'Managed and elastic services can reduce scaling bottlenecks and operational overhead.' },
  { id: 'efficient_compute', category: 'sustainability', weight: 4, text: 'Do you review compute efficiency, modern instance families and Graviton suitability?', help: 'Efficient compute can reduce both cost and resource consumption.' },
  { id: 'storage_lifecycle', category: 'sustainability', weight: 4, text: 'Do S3 and other storage platforms use lifecycle policies to move or delete stale data?', help: 'Lifecycle management reduces cost and unnecessary retained capacity.' }
];

export const categories = ['security', 'reliability', 'cost', 'operations', 'performance', 'sustainability'];

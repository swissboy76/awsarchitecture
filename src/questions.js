const simpleQuestions = [
  { id: 'access_known', category: 'security', weight: 4, text: 'Do you know who currently has access to make important changes in your AWS account?', help: 'Keep a clear list of people and suppliers with powerful access, and remove access promptly when it is no longer needed.', finding: 'It may not be clear who has powerful access to your AWS account.' },
  { id: 'people_mfa', category: 'security', weight: 5, text: 'Do people with administrator or powerful access use multi-factor authentication (MFA)?', help: 'MFA provides an important extra barrier if a password is stolen.', finding: 'Powerful AWS access may not be fully protected by multi-factor authentication.' },
  { id: 'internet_exposure', category: 'security', weight: 4, text: 'Do you know which of your AWS systems or data can be reached from the public internet?', help: 'Internet-facing systems and data should be intentional, understood and regularly reviewed.', finding: 'Public internet exposure may not be fully understood or reviewed.' },

  { id: 'backups_known', category: 'recovery', weight: 5, text: 'Do you know whether your important AWS data and systems are backed up?', help: 'Identify what must be backed up, how often backups run and how long they are retained.', finding: 'Backup coverage for important systems or data may be unclear.' },
  { id: 'restore_tested', category: 'recovery', weight: 5, text: 'Have you successfully restored important data from a backup within the last year?', help: 'A successful restore test is the best evidence that a backup can actually be used when needed.', finding: 'Your backups may not have been proven by a recent restore test.' },
  { id: 'backup_failure_alert', category: 'recovery', weight: 4, text: 'Would someone notice quickly if your backups stopped working?', help: 'Backup failures should generate alerts that reach a named person who is responsible for acting on them.', finding: 'A failed backup could potentially go unnoticed.' },

  { id: 'bill_understood', category: 'cost', weight: 4, text: 'Do you understand the main things you are paying for on your monthly AWS bill?', help: 'Knowing the main cost drivers makes unusual spend and savings opportunities much easier to identify.', finding: 'The main drivers of your AWS bill may not be clear.' },
  { id: 'bill_alert', category: 'cost', weight: 5, text: 'Would you be alerted if your AWS bill suddenly became much higher than normal?', help: 'AWS can alert you to unexpected spend before it becomes a large surprise.', finding: 'Unexpected AWS spending may not be detected quickly.' },
  { id: 'unused_resources', category: 'cost', weight: 3, text: 'Do you regularly check for old or unused AWS resources that are still costing money?', help: 'Old servers, disks, snapshots, addresses and other resources can continue generating charges long after they stop being useful.', finding: 'Unused AWS resources may be adding unnecessary cost.' },

  { id: 'clear_owner', category: 'management', weight: 5, text: 'Is there a clearly identified person or supplier responsible for looking after your AWS environment?', help: 'Someone should have explicit responsibility for security, cost, backups and day-to-day AWS management.', finding: 'Responsibility for your AWS environment may not be clearly owned.' },
  { id: 'changes_updates', category: 'management', weight: 4, text: 'Are important AWS changes, software updates and security fixes handled in a controlled and repeatable way?', help: 'A simple documented process reduces the risk of forgotten updates and accidental configuration changes.', finding: 'Changes, updates or security fixes may rely too heavily on ad-hoc manual work.' },

  { id: 'outage_plan', category: 'continuity', weight: 5, text: 'If your main AWS service stopped working tomorrow, would you know what to do?', help: 'Even a short recovery plan should identify who responds, what matters most and how service is restored.', finding: 'There may not be a clear plan for a serious AWS outage.' },
  { id: 'service_alerts', category: 'continuity', weight: 4, text: 'Would the right person be alerted quickly if an important AWS system failed?', help: 'Critical systems should be monitored so failures are detected before customers or staff have to report them.', finding: 'Important AWS failures may not reach the right person quickly.' },

  { id: 'setup_confidence', category: 'confidence', weight: 4, text: 'Are you confident that your AWS environment is set up safely and appropriately for your business?', help: 'Low confidence is a useful signal that an independent review could identify hidden risks or unnecessary complexity.', finding: 'You may not have enough assurance that the AWS setup is appropriate for the business.' },
  { id: 'knowledge_shared', category: 'confidence', weight: 3, text: 'Could someone else understand the important parts of your AWS setup if the usual person was unavailable?', help: 'Basic documentation and shared knowledge reduce dependency on a single employee, developer or supplier.', finding: 'Knowledge of the AWS environment may depend too heavily on one person.' }
];

const technicalQuestions = [
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

export const assessments = {
  simple: {
    id: 'simple',
    title: 'AWS Cloud Health Check',
    description: 'A plain-English check for business owners, IT generalists, developers and teams that use AWS without needing deep AWS architecture knowledge.',
    categories: [
      { key: 'security', label: 'Security' },
      { key: 'recovery', label: 'Backup & Recovery' },
      { key: 'cost', label: 'Cost Control' },
      { key: 'management', label: 'Day-to-Day Management' },
      { key: 'continuity', label: 'Business Continuity' },
      { key: 'confidence', label: 'Confidence' }
    ],
    questions: simpleQuestions
  },
  technical: {
    id: 'technical',
    title: 'Technical AWS Architecture Assessment',
    description: 'A more detailed screening for people who are comfortable with AWS services, architecture and operational controls.',
    categories: [
      { key: 'security', label: 'Security' },
      { key: 'reliability', label: 'Reliability' },
      { key: 'cost', label: 'Cost' },
      { key: 'operations', label: 'Operations' },
      { key: 'performance', label: 'Performance' },
      { key: 'sustainability', label: 'Sustainability' }
    ],
    questions: technicalQuestions
  }
};

export function getAssessment(mode = 'simple') {
  return assessments[mode] || assessments.simple;
}

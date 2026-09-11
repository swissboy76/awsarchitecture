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

const aiQuestions = [
  { id: 'repeatable_work', category: 'process', weight: 5, text: 'Have you already reduced most repetitive admin that staff do manually?', help: 'Repeated copying, checking, summarising, categorising and drafting are often good places to look for practical AI assistance.', finding: 'Repetitive admin may be a strong opportunity for AI-assisted automation.' },
  { id: 'handoffs', category: 'process', weight: 4, text: 'Do routine processes move smoothly between people without lots of chasing, re-keying or manual checking?', help: 'AI can often help extract, classify and route information between existing business processes.', finding: 'Manual handoffs and re-keying may be consuming avoidable staff time.' },
  { id: 'documents', category: 'process', weight: 4, text: 'Are documents, emails and forms handled efficiently without large amounts of manual reading or data entry?', help: 'Modern AI can summarise, extract and structure information from common business documents.', finding: 'Document and email handling may contain useful AI automation opportunities.' },
  { id: 'knowledge_findable', category: 'knowledge', weight: 5, text: 'Can staff quickly find the right answer in your policies, procedures and business documents?', help: 'A secure internal AI assistant can help people search and use approved company knowledge using natural language.', finding: 'Business knowledge may be difficult for staff to find and use consistently.' },
  { id: 'key_people', category: 'knowledge', weight: 5, text: 'Is important business knowledge documented rather than living mainly in the heads of a few key people?', help: 'Capturing and making knowledge searchable can reduce key-person dependency and improve onboarding.', finding: 'Important knowledge may depend too heavily on a small number of people.' },
  { id: 'consistent_answers', category: 'knowledge', weight: 4, text: 'Do staff give customers and colleagues consistent answers to common questions?', help: 'AI grounded in approved business content can help staff respond more consistently while keeping humans in control.', finding: 'An AI knowledge assistant could improve consistency of common answers.' },
  { id: 'customer_queries', category: 'customers', weight: 5, text: 'Are common customer enquiries handled quickly without taking substantial staff time?', help: 'AI can draft replies, triage enquiries and surface the right information while leaving important decisions to staff.', finding: 'Routine customer enquiries may be taking more staff time than necessary.' },
  { id: 'response_speed', category: 'customers', weight: 4, text: 'Can customers reliably get useful answers when your team is busy or unavailable?', help: 'A carefully scoped AI assistant can extend access to approved information without pretending to replace your team.', finding: 'There may be an opportunity to improve response speed with an AI-assisted service.' },
  { id: 'customer_insight', category: 'customers', weight: 3, text: 'Do you regularly learn from the questions, comments and issues your customers raise?', help: 'AI can group and summarise large volumes of feedback to expose recurring themes and opportunities.', finding: 'Customer conversations may contain useful insight that is not being captured systematically.' },
  { id: 'reporting', category: 'data', weight: 4, text: 'Can managers get useful answers from business data without spending hours assembling spreadsheets and reports?', help: 'AI-assisted analysis can speed up reporting and help people explore information in plain English.', finding: 'Management reporting and analysis may be more manual than it needs to be.' },
  { id: 'data_access', category: 'data', weight: 4, text: 'Is useful business information easy to access across the systems you already use?', help: 'AI delivers more value when the right information can be accessed safely and reliably.', finding: 'Useful information may be fragmented across systems, limiting what AI can do today.' },
  { id: 'data_quality', category: 'data', weight: 3, text: 'Is the information you rely on generally accurate, current and well organised?', help: 'AI will amplify poor information as readily as good information, so data quality is an important foundation.', finding: 'Improving information quality may be an important first step before wider AI adoption.' },
  { id: 'clear_goal', category: 'readiness', weight: 5, text: 'Do you have a clear business problem you would want AI to solve rather than adopting AI for its own sake?', help: 'The best SME AI projects start with a measurable problem such as time saved, faster service or fewer manual errors.', finding: 'The business case for AI may need to be defined before selecting technology.' },
  { id: 'information_rules', category: 'readiness', weight: 4, text: 'Do you know what information staff are allowed to put into AI tools and what must stay private?', help: 'Simple rules for confidential, personal and commercially sensitive information are essential before wider AI use.', finding: 'AI information-handling rules may need to be clarified.' },
  { id: 'human_review', category: 'readiness', weight: 4, text: 'Would important AI-generated work be checked by a person before it affects customers, money or business decisions?', help: 'Human review is an important control for higher-impact uses of AI.', finding: 'Human oversight should be designed into higher-impact AI use cases.' }
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
  },
  ai: {
    id: 'ai',
    title: 'Free AI Opportunity Assessment',
    description: 'A plain-English assessment for SMEs to identify where AI could save time, improve access to knowledge and make everyday work easier.',
    categories: [
      { key: 'process', label: 'Processes' },
      { key: 'knowledge', label: 'Knowledge' },
      { key: 'customers', label: 'Customer Service' },
      { key: 'data', label: 'Data & Reporting' },
      { key: 'readiness', label: 'AI Readiness' }
    ],
    questions: aiQuestions
  }
};

export function getAssessment(mode = 'simple') {
  return assessments[mode] || assessments.simple;
}

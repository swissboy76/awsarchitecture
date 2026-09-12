const SITE_ORIGIN = 'https://cloudfixer.org';

export const seoPages = {
  '/': ['CloudFIXER | Practical Cloud & AI Help for SMEs','Practical cloud and AI help for small and growing businesses. Find wasted effort, cloud risk and useful technology improvements with free CloudFIXER assessments.'],
  '/ai': ['Free AI Opportunity Assessment for SMEs | CloudFIXER','Find repetitive work, trapped knowledge and manual processes where AI or automation could help your business. Free two-minute SME assessment.'],
  '/aws': ['Free AWS Cloud Health Check for SMEs | CloudFIXER','Check your AWS environment for security, backup, cost and resilience risks with a free plain-English cloud health assessment built by AWS and cloud professionals.'],
  '/cloud-readiness': ['Cloud Readiness for SMEs | CloudFIXER','Understand whether moving to the cloud makes business sense, what should move, what should stay and what to consider before committing to migration.'],
  '/cloud-migration': ['Cloud Migration for SMEs | CloudFIXER','Practical cloud migration planning for SMEs, with a focus on controlled risk, sensible sequencing and keeping the business running.'],
  '/ai-repetitive-admin': ['Use AI to Reduce Repetitive Admin in a Small Business | CloudFIXER','Find repetitive admin, copying, checking and document work that AI or automation may be able to reduce in your small business.'],
  '/ai-business-knowledge': ['Use AI to Make Business Knowledge Easier to Find | CloudFIXER','Explore how AI can help staff find policies, procedures, answers and business knowledge without relying on one key person.'],
  '/ai-customer-service': ['AI for Customer Service in Small Businesses | CloudFIXER','Find practical ways AI can help SMEs answer repeated customer questions, prepare responses and reduce routine customer-service workload.'],
  '/ai-reporting': ['AI for Reporting and Business Information | CloudFIXER','Explore where AI and automation can reduce manual reporting, spreadsheet work and time spent searching for business information.'],
  '/ai-small-business': ['AI for Small Business: Where Should You Start? | CloudFIXER','A practical guide for SMEs looking for useful AI opportunities without needing an AI strategy, large project or technical team.'],
  '/aws-health-check': ['AWS Health Check for Small Businesses | CloudFIXER','A practical AWS health check for SMEs covering security, backup, cost, resilience and day-to-day cloud management.'],
  '/aws-cost-review': ['AWS Cost Review for SMEs | CloudFIXER','Understand the main drivers of your AWS bill, spot unnecessary spend and identify sensible cloud cost-control improvements.'],
  '/aws-backup-risk': ['AWS Backup and Recovery Risk for SMEs | CloudFIXER','Check whether important AWS systems and data are backed up, monitored and realistically recoverable if something goes wrong.'],
  '/aws-security-check': ['AWS Security Check for Small Businesses | CloudFIXER','A practical SME AWS security check covering access, MFA, internet exposure and basic cloud security controls.'],
  '/cloud-readiness-small-business': ['Cloud Readiness for Small Businesses | CloudFIXER','Work out whether cloud migration is right for your small business before committing money, time and disruption to a move.']
};

const aiGuides = [
  ['/ai-repetitive-admin','Reduce repetitive admin'],
  ['/ai-business-knowledge','Make business knowledge easier to find'],
  ['/ai-customer-service','Improve routine customer service'],
  ['/ai-reporting','Reduce manual reporting'],
  ['/ai-small-business','Where should a small business start with AI?']
];

const awsGuides = [
  ['/aws-health-check','AWS health check for SMEs'],
  ['/aws-cost-review','Review AWS costs'],
  ['/aws-backup-risk','Check AWS backup and recovery risk'],
  ['/aws-security-check','Check AWS security basics'],
  ['/cloud-readiness-small-business','Is your small business cloud-ready?']
];

function esc(v=''){
  return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

export function seoMarkup(pathname){
  const page = seoPages[pathname];
  if(!page) return '';
  const [title, description] = page;
  const canonical = `${SITE_ORIGIN}${pathname === '/' ? '' : pathname}`;
  const jsonLd = pathname === '/'
    ? {'@context':'https://schema.org','@type':'Organization',name:'CloudFIXER',url:canonical,description}
    : {'@context':'https://schema.org','@type':'WebPage',name:title,url:canonical,description};
  return `\n<link rel="canonical" href="${canonical}" />
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="CloudFIXER" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n`;
}

export function guideSection(pathname){
  let groups;
  let heading;
  let intro;
  if(pathname === '/'){
    heading = 'Practical guides for common SME problems';
    intro = 'Explore a specific cloud or AI problem, then use a free assessment to see what matters most in your business.';
    groups = [['AI & automation',aiGuides],['AWS & cloud',awsGuides]];
  } else if(pathname === '/ai' || pathname.startsWith('/ai-')){
    heading = 'More practical AI guides for SMEs';
    intro = 'Explore another common business problem or go straight to the free AI Opportunity Assessment.';
    groups = [['AI & automation',aiGuides.filter(([href])=>href!==pathname)]];
  } else if(pathname === '/aws' || pathname.startsWith('/aws-') || pathname === '/cloud-readiness-small-business'){
    heading = 'More practical AWS and cloud guides';
    intro = 'Explore another common cloud problem or use the free AWS health check to see what needs attention first.';
    groups = [['AWS & cloud',awsGuides.filter(([href])=>href!==pathname)]];
  } else {
    return '';
  }
  const body = groups.map(([label,links])=>`<div><div style="font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;font-weight:850;color:#8c565b;margin-bottom:10px">${label}</div><div style="display:grid;gap:8px">${links.map(([href,text])=>`<a href="${href}" style="color:#42191d;text-decoration:none;font-weight:720">${esc(text)} <span aria-hidden="true">→</span></a>`).join('')}</div></div>`).join('');
  return `<section aria-label="CloudFIXER guides" style="max-width:1120px;margin:46px auto 0;padding:0 28px"><div style="background:linear-gradient(135deg,#fff,#faf6f5 62%,#eef5f3);border:1px solid #e8dfe0;border-radius:20px;padding:28px;box-shadow:0 12px 30px rgba(66,25,29,.045)"><h2 style="color:#42191d;font-size:1.8rem;line-height:1.08;margin:0 0 7px;letter-spacing:-.035em">${heading}</h2><p style="color:#756c6e;margin:0 0 22px;max-width:760px">${intro}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:24px">${body}</div></div></section>`;
}

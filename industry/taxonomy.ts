// 这个行业的分类体系：类别、标签词表、机构与企业（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（观点、解读）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "policy", label: "政策", feedLabel: "电力政策", section: "政策与规则", guide: "国家与部委层面的电力政策文件、规划目标、通知与办法、征求意见稿、电价与价格机制的正式发文，以及监管处罚、事故调查通报与整改要求。只转载政策原文、或只有一句政策标题而没有实质内容的，不算政策动态；评论与解读归观点，规则与交易机制本身归市场，成规模的运行数字归数据。" },
  { key: "market", label: "市场", feedLabel: "电力市场", section: "市场与交易", guide: "电力市场机制与交易的变化：中长期与现货市场规则、绿电绿证、辅助服务、容量补偿与需求侧响应机制的调整，市场开市与结算规则的变化，以及成交规模与市场运行结果。管理办法与规则条文的正式发文本身归政策，只有量的成交与运行数字归数据。" },
  { key: "grid", label: "电网", feedLabel: "电网与基建", section: "电网与基建", guide: "电网侧的变化：电网投资与特高压工程、配电网改造、输电通道与跨区跨省输送安排，电网企业的工程公告与设备集中招标，输配电价的核定与调整。各能源品种的电站项目归对应的能源类别，输配电价水平与定价机制本身归政策。" },
  { key: "coal", label: "煤电", feedLabel: "煤电与燃气", section: "电源与新能源", guide: "煤电、燃气等常规电源侧的变化：项目的核准、开工、并网、投产与技改改造，煤电容量电价与灵活性改造的进展，煤耗与燃料成本，淘汰退出的安排。装机与发电量的统计数字归数据，水电与核电归各自类别，新能源归风电、光伏、储能。" },
  { key: "hydro", label: "水电", feedLabel: "水电", section: "电源与新能源", guide: "水电与抽水蓄能侧的变化：水库电站与抽蓄项目的核准、开工、并网、投产，梯级开发与流域调度安排，来水与发电量统计（统计数字本身归数据）。常规火电归煤电，新能源归风电、光伏、储能。" },
  { key: "nuclear", label: "核电", feedLabel: "核电", section: "电源与新能源", guide: "核电侧的变化：在建机组的核准与开工、首堆投运与并网，核电安全监管与停复工，运行数据与铀供应（统计数字本身归数据）。常规火电归煤电，水电归水电。" },
  { key: "wind", label: "风电", feedLabel: "风电", section: "电源与新能源", guide: "风电侧的变化：陆上与海上风电项目的核准、开工、并网、投产，海域使用与环评审批，风机大型化与整机价格，退役与改造。光伏归光伏，常规火电归煤电。" },
  { key: "solar", label: "光伏", feedLabel: "光伏", section: "电源与新能源", guide: "光伏侧的变化：集中式与分布式电站的核准、开工、并网、投产，组件价格与产能，消纳与限电情况，出口与贸易措施。风电归风电，储能归储能，常规火电归煤电。" },
  { key: "storage", label: "储能", feedLabel: "储能", section: "电源与新能源", guide: "新型储能侧的变化：独立与共享储能电站的核准、开工、并网、投产，容量电价与调用规则，招标与装机统计（统计数字本身归数据），以及氢能等新型供能方式的政策与项目。电池与设备企业的订单与产能归行业，储能电站本身归这一类。" },
  { key: "data", label: "数据", feedLabel: "数据与解读", section: "数据与解读", guide: "以数字与统计口径为主的材料：全社会用电量、发电量、装机容量、电网投资、跨区输电与电力进出口等运行与统计数据，以及口径调整说明。数字只是某项政策、项目或成交结论的支撑时，归那一类。" },
  { key: "industry", label: "行业", feedLabel: "行业动态", section: "行业动态", guide: "行业与企业的经营动作：发电集团、电网公司与设备厂商的投资、人事、并购、合作、订单与经营业绩，以及行业性事件。政策文件与它带来的直接影响归政策，项目的核准与投产归对应的能源类别，事故与调查通报归政策。" },
  { key: "opinion", label: "观点", feedLabel: "观点评论", section: "数据与解读", guide: "重点是作者的解释、判断、主张、预测、评论或访谈观点。发布机构解读自家政策并给出新要求的，仍归政策；只做展望、讲趋势与背景的，归观点。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（电力行业是政策文件）：日报报头的“N 项新政策”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "policy", tag: "政策发布", unit: "项新政策" };

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["电力", "电网", "电价", "新能源", "煤电", "现货市场", "容量电价", "绿电"];

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 */
export const ITEM_TYPES = ["policy_document", "market_change", "project_milestone", "data_release", "industry_event", "research_report", "opinion_analysis"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一；最后一项是没有更好选择时的兜底。 */
export const CATEGORY_TAGS = [
  "政策发布", "征求意见", "规则机制", "价格机制", "市场交易", "项目建设", "招标采购", "并网消纳",
  "数据发布", "安全/事故", "研究报告", "观点评论", "行业动态", "其他",
] as const;

/** 可选的主题标签：跨能源品种的业务方向（能源品种本身是类别，不在这里）。 */
export const TOPIC_TAGS = [
  "特高压", "配电网", "输配电价", "电力现货", "绿电绿证", "虚拟电厂", "需求侧响应",
  "碳市场", "智能电网", "储能", "氢能", "电力出海",
] as const;

/** 可选的实体标签（主管部门、电网与发电集团、设备厂商）。 */
export const ENTITY_TAGS = [
  "国家发改委", "国家能源局", "能源监管局", "国务院", "工信部", "生态环境部", "中电联",
  "国家电网", "南方电网", "国家能源集团", "华能", "大唐", "华电", "国家电投", "三峡集团", "中国广核",
] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  政策: "政策发布", 文件: "政策发布", 通知: "政策发布", 印发: "政策发布", 出台: "政策发布", 办法: "政策发布",
  规定: "政策发布", 规划: "政策发布", 意见: "政策发布", 方案: "政策发布", 法规: "政策发布", 政策解读: "观点评论",
  征求意见稿: "征求意见", 征求意见: "征求意见", 公开征求意见: "征求意见", 听证: "征求意见",
  规则: "规则机制", 机制: "规则机制", 交易规则: "规则机制", 结算规则: "规则机制", 辅助服务: "规则机制",
  容量机制: "规则机制", 容量电价: "价格机制",
  价格: "价格机制", 电价: "价格机制", 调价: "价格机制", 分时电价: "价格机制", 代理购电: "价格机制", 输配电价: "价格机制",
  交易: "市场交易", 成交: "市场交易", 现货: "市场交易", 中长期: "市场交易", 绿电: "市场交易", 绿证: "市场交易", 电力现货市场: "市场交易",
  项目: "项目建设", 核准: "项目建设", 开工: "项目建设", 投产: "项目建设", 并网: "项目建设", 投运: "项目建设",
  消纳: "并网消纳", 弃风: "并网消纳", 弃光: "并网消纳", 利用率: "并网消纳", 跨省: "并网消纳",
  招标: "招标采购", 中标: "招标采购", 采购: "招标采购", 集采: "招标采购", 框架协议: "招标采购",
  数据: "数据发布", 统计: "数据发布", 用电量: "数据发布", 发电量: "数据发布", 装机: "数据发布", 投资完成: "数据发布",
  事故: "安全/事故", 故障: "安全/事故", 安全: "安全/事故", 通报: "安全/事故",
  报告: "研究报告", 白皮书: "研究报告", 标准: "研究报告", 规范: "研究报告", 形势分析: "研究报告",
  观点: "观点评论", 评论: "观点评论", 预测: "观点评论", 展望: "观点评论", 访谈: "观点评论", 解读: "观点评论", 专家: "观点评论",
  融资: "行业动态", 收购: "行业动态", 并购: "行业动态", 人事: "行业动态", 合作: "行业动态", 业绩: "行业动态", 公司动态: "行业动态",
};

// ── 机构与企业 ──────────────────────────────────────────────────────────────────────────

/**
 * 主体名录：主管部门、电网与发电集团、设备厂商，用于“机构与企业”类主题页。
 * aliases 给结构抽取模型看；otherNames 是它自己的其他称呼（官方英文名、简称），
 * 把事实的主体对到发布方时也认它们。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  ndrc: { name: "国家发展改革委", displayTag: "国家发改委", aliases: ["国家发展改革委", "国家发改委", "发改委", "发展改革委"], otherNames: ["NDRC"] },
  nea: { name: "国家能源局", displayTag: "国家能源局", aliases: ["国家能源局", "能源局"], otherNames: ["NEA"] },
  "energy-regulators": { name: "能源监管机构", displayTag: "能源监管局", aliases: ["能源监管机构", "能源监管局", "能源监管办", "国家能源局派出机构"], otherNames: [] },
  "state-council": { name: "国务院", displayTag: "国务院", aliases: ["国务院", "国务院办公厅"], otherNames: [] },
  miit: { name: "工业和信息化部", displayTag: "工信部", aliases: ["工业和信息化部", "工信部"], otherNames: ["MIIT"] },
  mee: { name: "生态环境部", displayTag: "生态环境部", aliases: ["生态环境部", "环保部"], otherNames: [] },
  cec: { name: "中国电力企业联合会", displayTag: "中电联", aliases: ["中国电力企业联合会", "中电联", "电力企业联合会"], otherNames: ["CEC"] },
  sgcc: { name: "国家电网", displayTag: "国家电网", aliases: ["国家电网", "国家电网有限公司", "国网"], otherNames: ["State Grid", "SGCC"] },
  csg: { name: "南方电网", displayTag: "南方电网", aliases: ["南方电网", "南方电网有限责任公司", "南网"], otherNames: ["CSG"] },
  ceic: { name: "国家能源集团", displayTag: "国家能源集团", aliases: ["国家能源集团", "国家能源投资集团", "神华"], otherNames: ["CHN Energy"] },
  huaneng: { name: "中国华能", displayTag: "华能", aliases: ["中国华能", "华能", "华能集团"], otherNames: ["Huaneng"] },
  "china-datang": { name: "中国大唐", displayTag: "大唐", aliases: ["中国大唐", "大唐", "大唐集团"], otherNames: ["Datang"] },
  huadian: { name: "中国华电", displayTag: "华电", aliases: ["中国华电", "华电", "华电集团"], otherNames: ["Huadian"] },
  spic: { name: "国家电投", displayTag: "国家电投", aliases: ["国家电投", "国家电力投资集团", "国电投"], otherNames: ["SPIC"] },
  "three-gorges": { name: "三峡集团", displayTag: "三峡集团", aliases: ["三峡集团", "中国长江三峡集团", "三峡"], otherNames: [] },
  cgn: { name: "中国广核", displayTag: "中国广核", aliases: ["中国广核", "中国广核集团", "中广核"], otherNames: ["CGN"] },
  catl: { name: "宁德时代", displayTag: null, aliases: ["宁德时代", "宁德时代新能源"], otherNames: ["CATL"] },
  sungrow: { name: "阳光电源", displayTag: null, aliases: ["阳光电源", "阳光电源股份有限公司"], otherNames: ["Sungrow"] },
  tbea: { name: "特变电工", displayTag: null, aliases: ["特变电工", "特变电工股份有限公司"], otherNames: ["TBEA"] },
};

/**
 * 身份词典：摘要和标题里出现的机构或公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 行业没有这个问题时可以留空数组。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "ndrc", name: "国家发改委", patterns: [/国家发展改革委|国家发改委|发改委|\bNDRC\b/i] },
  { id: "nea", name: "国家能源局", patterns: [/国家能源局|能源局|\bNEA\b/i] },
  { id: "energy-regulators", name: "能源监管机构", patterns: [/能源监管局|能源监管办|监管办|能源监管机构/] },
  { id: "state-council", name: "国务院", patterns: [/国务院/] },
  { id: "miit", name: "工信部", patterns: [/工业和信息化部|工信部|\bMIIT\b/i] },
  { id: "mee", name: "生态环境部", patterns: [/生态环境部|环保部/] },
  { id: "cec", name: "中电联", patterns: [/中国电力企业联合会|中电联|\bCEC\b/i] },
  { id: "sgcc", name: "国家电网", patterns: [/国家电网|国网|\bstate\s?grid\b|\bSGCC\b/i] },
  { id: "csg", name: "南方电网", patterns: [/南方电网|南网/] },
  { id: "ceic", name: "国家能源集团", patterns: [/国家能源集团|国家能源投资集团|神华|\bCHN\s?Energy\b/i] },
  { id: "huaneng", name: "中国华能", patterns: [/中国华能|华能|\bHuaneng\b/i] },
  { id: "china-datang", name: "中国大唐", patterns: [/中国大唐|大唐|\bDatang\b/i] },
  { id: "huadian", name: "中国华电", patterns: [/中国华电|华电|\bHuadian\b/i] },
  { id: "spic", name: "国家电投", patterns: [/国家电投|国家电力投资集团|国电投|(?<![A-Za-z])SPIC(?![A-Za-z])/i] },
  { id: "three-gorges", name: "三峡集团", patterns: [/中国长江三峡集团|三峡集团|三峡/] },
  { id: "cgn", name: "中国广核", patterns: [/中国广核|中广核|\bCGN\b/i] },
  { id: "catl", name: "宁德时代", patterns: [/宁德时代|\bCATL\b/i] },
  { id: "sungrow", name: "阳光电源", patterns: [/阳光电源|\bSungrow\b/i] },
  { id: "tbea", name: "特变电工", patterns: [/特变电工|\bTBEA\b/i] },
];

/** 这些域名上的文章，发布方就是对应的机构或公司（托管平台不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "ndrc", domains: ["ndrc.gov.cn"] },
  { entityId: "nea", domains: ["nea.gov.cn"] },
  { entityId: "state-council", domains: ["gov.cn"] },
  { entityId: "miit", domains: ["miit.gov.cn"] },
  { entityId: "mee", domains: ["mee.gov.cn"] },
  { entityId: "cec", domains: ["cec.org.cn"] },
  { entityId: "sgcc", domains: ["sgcc.com.cn"] },
  { entityId: "csg", domains: ["csg.cn"] },
  { entityId: "ceic", domains: ["chnenergy.com.cn", "ceic.com"] },
  { entityId: "huaneng", domains: ["chng.com.cn"] },
  { entityId: "china-datang", domains: ["chinapower.com.cn"] },
  { entityId: "huadian", domains: ["chd.com.cn"] },
  { entityId: "spic", domains: ["spic.com.cn"] },
  { entityId: "three-gorges", domains: ["ctg.com.cn"] },
  { entityId: "cgn", domains: ["cgnpc.com.cn"] },
  { entityId: "catl", domains: ["catl.com"] },
  { entityId: "sungrow", domains: ["sungrowpower.com"] },
  { entityId: "tbea", domains: ["tbea.com"] },
];

/** 原文里的这些写法也算提到了对应机构（官方公众号与英文账号名）。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [];

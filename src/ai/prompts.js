export function buildPoiPrompt(motion, side) {
  const userSide = side === 'prop' ? '正方' : '反方'
  const opponentSide = side === 'prop' ? '反方' : '正方'
  const args = side === 'prop' ? motion.propArgs : motion.oppArgs

  let argsText = ''
  args.forEach((a, i) => {
    argsText += `\n${userSide}论点${i + 1}:\n`
    if (a.claim_en || a.claim_zh)
      argsText += `Claim: ${a.claim_en || a.claim_zh}\n`

    // Mechanism 支持拆步骤
    if (a.mechanism_points && a.mechanism_points.length > 0) {
      argsText += `Mechanism:\n`
      a.mechanism_points.forEach((p, idx) => {
        argsText += `  步骤${idx + 1}: ${p.text_en || p.text_zh}\n`
      })
    } else if (a.mechanism_en || a.mechanism_zh) {
      argsText += `Mechanism: ${a.mechanism_en || a.mechanism_zh}\n`
    }

    if (a.comparative_en || a.comparative_zh)
      argsText += `Comparative: ${a.comparative_en || a.comparative_zh}\n`
    if (a.impact_en || a.impact_zh)
      argsText += `Impact: ${a.impact_en || a.impact_zh}\n`
  })

  return `你是一位经验丰富的BP辩论教练。现在你扮演${opponentSide}角色，针对用户的${userSide}论点提出4条POI质询（Point of Information）。

辩题: ${motion.text}
${argsText}

要求:
1. 生成4条POI质询，每条一句话以内
2. 覆盖不同攻击角度：机制漏洞、比较优先级、反例、影响现实性
3. 用简体中文编号列表输出（1. 2. 3. 4.）
4. 语气要像真实辩论赛场上的质询，简洁有力`
}

export function buildWeaknessPrompt(motion) {
  const typeHint = motion.motionType ? `这是一道 ${motion.motionType} 类型的题目。` : ''

  const formatArgs = (args, side) => {
    return args.map((a, i) => {
      let text = `论点${i + 1}:\n`
      text += `- Claim: ${a.claim_en || a.claim_zh || '未填写'}\n`

      // Mechanism 支持拆步骤
      if (a.mechanism_points && a.mechanism_points.length > 0) {
        text += `- Mechanism:\n`
        a.mechanism_points.forEach((p, idx) => {
          text += `  步骤${idx + 1}: ${p.text_en || p.text_zh || '未填写'}\n`
        })
      } else {
        text += `- Mechanism: ${a.mechanism_en || a.mechanism_zh || '未填写'}\n`
      }

      text += `- Comparative: ${a.comparative_en || a.comparative_zh || '未填写'}\n`
      text += `- Impact: ${a.impact_en || a.impact_zh || '未填写'}\n`
      return text
    }).join('\n')
  }

  const propText = formatArgs(motion.propArgs, '正方')
  const oppText = formatArgs(motion.oppArgs, '反方')

  const thrCheck = motion.motionType?.includes('THR') ? '4. THR特项检查：遗憾的对象有没有被具象化？' : ''
  const thoCheck = motion.motionType?.includes('THO') ? '4. THO特项检查：反对的是性质还是程度？论点有没有混淆这两者？' : ''

  return `你是一个严格的 British Parliamentary 辩论评委。${typeHint}

辩题：${motion.text}

正方论点：
${propText}

反方论点：
${oppText}

请按以下结构逐一检查，用简体中文回复：

【正方论点漏洞】
逐条检查每个论点：
1. Mechanism是否有逻辑跳跃（原因和结果之间缺少步骤）？
2. Impact是否只是在陈述结果而没有说清楚"为什么这个结果重要/比对方更重要"？
3. 是否有反例会直接推翻这个论点？
${thrCheck}
${thoCheck}

【反方论点漏洞】
逐条检查每个论点：
1. Mechanism是否有逻辑跳跃（原因和结果之间缺少步骤）？
2. Impact是否只是在陈述结果而没有说清楚"为什么这个结果重要/比对方更重要"？
3. 是否有反例会直接推翻这个论点？
${thrCheck}
${thoCheck}

【整体结构性短板】
正反双方交锋在哪里最薄弱？哪个核心分歧没有被充分论证？`
}

export function buildSimilarPrompt(motion, allMotions) {
  // 优先走 Core Clash 精确匹配（兼容旧数据单字符串 + 新数据数组）
  const motionClashes = motion.coreClashes || (motion.coreClash ? [motion.coreClash] : [])

  if (motionClashes.length > 0) {
    // 找所有匹配任一 Core Clash 的题目
    const sameClash = allMotions.filter((m) => {
      if (m.id === motion.id) return false
      const otherClashes = m.coreClashes || (m.coreClash ? [m.coreClash] : [])
      return otherClashes.some((c) => motionClashes.includes(c))
    })

    if (sameClash.length > 0) {
      const list = sameClash.map((m) => `- ${m.text}`).join('\n')
      const clashesStr = motionClashes.join(' / ')
      return `你是一位BP辩论教练。以下题目都属于相同的核心矛盾结构"${clashesStr}"：

当前题目: ${motion.text}

相同结构的其他题目:
${list}

请用简体中文解释:
1. 这些题目如何共享"${clashesStr}"这一底层矛盾结构
2. 训练时如何做思路迁移（一道题的论证框架怎么套用到另一道）
3. 这类结构的共同攻防要点`
    }
  }

  // 兜底逻辑：文本相似度推荐
  const otherMotions = allMotions
    .filter((m) => m.id !== motion.id)
    .slice(0, 400)
    .map((m) => m.text)
  const list = otherMotions.map((t, i) => `${i + 1}. ${t}`).join('\n')

  let extra = ''
  if (motionClashes.length === 0) {
    extra =
      '\n4. 如果当前题目还没有标记 Core Clash，建议一个（格式如"Innovation vs Safety"）'
  }

  return `你是一位BP辩论教练。请从下面的题库里推荐3-5道跟当前题目相似的辩题。

当前题目: ${motion.text}

题库（只能从这个列表里选，不能编造）:
${list}

要求:
1. 基于主题或论证结构相似性推荐3-5道
2. 逐字引用题目原文（序号+完整标题）
3. 解释为什么相似、训练时怎么做思路迁移${extra}
4. 用简体中文输出`
}

export function buildPdfExtractPrompt(motionText, pdfText) {
  const motionPart = motionText
    ? `\n关联的辩题: ${motionText}\n`
    : '\n（用户未关联具体辩题，通用提炼即可）\n'

  return `你是一位BP辩论教练。请从以下材料中提炼辩论可用的信息。${motionPart}
材料原文:
${pdfText}

要求:
1. 可用于正方/支持方的核心论点（最多3条，主张+材料里的具体支撑事实或数据）
2. 可用于反方/反对方的攻击点（最多3条，材料暴露的薄弱环节或风险）
3. 材料里的关键数据/案例列表
4. 只能用材料里实际出现的信息，不能编造
5. 用简体中文输出`
}

export function buildGenerateArgumentsPrompt(motionText) {
  return `你是一位经验丰富的BP辩论教练。请为以下辩题生成完整的论点草稿。

辩题: ${motionText}

要求输出格式为严格的JSON（不要有任何Markdown代码块标记，直接返回JSON）：
{
  "coreClash": "建议的核心矛盾（如 Innovation vs Safety）",
  "propArgs": [
    {
      "name_en": "英文论点名称",
      "name_zh": "中文论点名称",
      "claim_en": "英文Claim",
      "claim_zh": "中文Claim",
      "mechanism_points": [
        {"text_en": "Step 1 in English", "text_zh": "第1步中文"},
        {"text_en": "Step 2 in English", "text_zh": "第2步中文"},
        {"text_en": "Step 3 in English", "text_zh": "第3步中文"}
      ],
      "comparative_en": "英文Comparative",
      "comparative_zh": "中文Comparative",
      "impact_en": "英文Impact",
      "impact_zh": "中文Impact"
    }
  ],
  "oppArgs": [
    // 同样结构，3条反方论点
  ]
}

要求:
1. 正反方各生成3条完整论点
2. 每条论点的Mechanism必须拆成3个逻辑清晰的推理步骤
3. 所有字段都要有英文和中文版本
4. Core Clash要准确反映这道题的底层矛盾结构
5. 直接返回JSON，不要有其他文字说明`
}

export function buildGenerateSideArgumentsPrompt(motionText, motionType, side) {
  const sideName = side === 'prop' ? '正方' : '反方'
  const typeHint = motionType ? `辩题类型是 ${motionType}。` : ''

  return `你是一个 British Parliamentary 辩论教练。${typeHint}这道题是：${motionText}

请为【${sideName}】生成3个独立论点，每个论点包含：
1. Claim（一句话主张）
2. Mechanism（因果机制，1-2句）
3. Comparative（比较基准，1句）
4. Impact（影响，1句）

用JSON格式返回，结构为：
[
  {
    "claim_en": "英文Claim",
    "claim_zh": "中文Claim",
    "mechanism_en": "英文Mechanism",
    "mechanism_zh": "中文Mechanism",
    "comparative_en": "英文Comparative",
    "comparative_zh": "中文Comparative",
    "impact_en": "英文Impact",
    "impact_zh": "中文Impact"
  }
]

只返回JSON数组，不要任何其他文字。`
}

export function buildPoiPrompt(motion, side) {
  const userSide = side === 'prop' ? '正方' : '反方'
  const opponentSide = side === 'prop' ? '反方' : '正方'
  const args = side === 'prop' ? motion.propArgs : motion.oppArgs

  let argsText = ''
  args.forEach((a, i) => {
    argsText += `\n${userSide}论点${i + 1}:\n`
    if (a.claim_en || a.claim_zh)
      argsText += `Claim: ${a.claim_en || a.claim_zh}\n`
    if (a.mechanism_en || a.mechanism_zh)
      argsText += `Mechanism: ${a.mechanism_en || a.mechanism_zh}\n`
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
  const formatArgs = (args, side) => {
    let text = `\n${side}:\n`
    args.forEach((a, i) => {
      text += `论点${i + 1}:\n`
      if (a.claim_en || a.claim_zh)
        text += `Claim: ${a.claim_en || a.claim_zh}\n`
      if (a.mechanism_en || a.mechanism_zh)
        text += `Mechanism: ${a.mechanism_en || a.mechanism_zh}\n`
      if (a.comparative_en || a.comparative_zh)
        text += `Comparative: ${a.comparative_en || a.comparative_zh}\n`
      if (a.impact_en || a.impact_zh)
        text += `Impact: ${a.impact_en || a.impact_zh}\n`
    })
    return text
  }

  const propText = formatArgs(motion.propArgs, '正方论点')
  const oppText = formatArgs(motion.oppArgs, '反方论点')

  return `你是一位BP辩论教练。请检查以下题卡的正反双方论点，指出逻辑漏洞。

辩题: ${motion.text}
${propText}
${oppText}

要求:
1. 按"正方论点"/"反方论点"分两部分
2. 逐条指出每个论点在 claim/mechanism/comparative/impact 里最薄弱的一环
3. 最后总结整道题的结构性短板
4. 用简体中文输出，直接指出问题，不需要客套`
}

export function buildSimilarPrompt(motion, allMotions) {
  // 优先走 Core Clash 精确匹配
  if (motion.coreClash) {
    const sameClash = allMotions.filter(
      (m) => m.id !== motion.id && m.coreClash === motion.coreClash
    )
    if (sameClash.length > 0) {
      const list = sameClash.map((m) => `- ${m.text}`).join('\n')
      return `你是一位BP辩论教练。以下题目都属于同一种核心矛盾结构"${motion.coreClash}"：

当前题目: ${motion.text}

相同结构的其他题目:
${list}

请用简体中文解释:
1. 这些题目如何共享"${motion.coreClash}"这一底层矛盾结构
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
  if (!motion.coreClash) {
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

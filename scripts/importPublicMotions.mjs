import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore'
import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 读取 .env.local
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim()
  }
})

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function importPublicMotions(csvPath) {
  console.log('读取 CSV...')
  const text = fs.readFileSync(csvPath, 'utf-8')

  console.log('解析 CSV（使用 papaparse，支持字段内换行）...')
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  })

  const rows = parsed.data
  console.log(`解析完成，共 ${rows.length} 条记录`)

  const col = collection(db, 'publicMotions')
  let imported = 0

  for (let i = 0; i < rows.length; i += 450) {
    const batch = writeBatch(db)
    const chunk = rows.slice(i, i + 450)

    chunk.forEach(row => {
      // 只导入有 motion 字段的记录
      if (!row.motion || !row.motion.trim()) return

      const ref = doc(col)
      batch.set(ref, {
        motion: row.motion,
        infoslide: row.infoslide || '',
        tournament_name: row.tournament_name || '',
        round: row.round || '',
        region: row.region || '',
        country: row.country || '',
        city: row.city || '',
        level: row.level || '',
        style: row.style || '',
        tab_url: row.tab_url || '',
        createdAt: serverTimestamp(),
      })
    })

    await batch.commit()
    imported += chunk.length
    console.log(`已导入 ${imported} / ${rows.length}`)
  }

  console.log('✅ 导入完成')
  process.exit(0)
}

const csvPath = process.argv[2]
if (!csvPath) {
  console.error('用法: node importPublicMotions.mjs <csv文件路径>')
  process.exit(1)
}

importPublicMotions(csvPath).catch(err => {
  console.error('导入失败:', err)
  process.exit(1)
})

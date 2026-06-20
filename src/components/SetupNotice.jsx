export default function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-4">
        <h1 className="text-xl font-semibold">还没配置 Firebase</h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          复制项目根目录下的 <code className="px-1 bg-stone-100 rounded">.env.example</code> 为 <code className="px-1 bg-stone-100 rounded">.env.local</code>,把 Firebase 项目的 Web 配置填进去后,重启 <code className="px-1 bg-stone-100 rounded">npm run dev</code>。
        </p>
        <p className="text-xs text-stone-400">
          (Claude 会引导你完成 Firebase 控制台的操作。)
        </p>
      </div>
    </div>
  )
}

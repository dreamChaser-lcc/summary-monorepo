import { NextResponse } from 'next/server';

// 模拟外部真实后端 API 的数据
// 在实际场景中，这里通常是数据库查询或第三方服务调用
const MOCK_EXTERNAL_DB = {
  '1': {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
    salary: 25000, // 敏感数据：工资
    internal_id: 'u_89757', // 敏感数据：内部ID
    last_login_ip: '192.168.1.1' // 敏感数据：IP
  },
  '2': {
    id: 2,
    name: 'Bob',
    email: 'bob@example.com',
    role: 'editor',
    salary: 18000,
    internal_id: 'u_33456',
    last_login_ip: '10.0.0.5'
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');

  // 1. 模拟调用外部接口 (External API Call)
  // 假设我们需要 500ms 来获取数据
  await new Promise(resolve => setTimeout(resolve, 500));

  const rawUser = MOCK_EXTERNAL_DB[userId as keyof typeof MOCK_EXTERNAL_DB];

  if (!rawUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 2. BFF 层的核心逻辑：数据裁剪与处理 (Data Transformation)
  // 我们不希望把 salary, internal_id, last_login_ip 暴露给前端
  // 同时我们想添加一个由 BFF 计算得出的字段 display_title
  const bffResponse = {
    id: rawUser.id,
    fullName: rawUser.name, // 重命名字段
    publicProfile: `${rawUser.name} (${rawUser.role})`, // 聚合字段
    contact: rawUser.email,
    // 标记这是经过 BFF 处理的数据
    _source: 'Next.js BFF Layer',
    _processedAt: new Date().toISOString()
  };

  // 3. 返回处理后的数据给前端
  return NextResponse.json(bffResponse);
}

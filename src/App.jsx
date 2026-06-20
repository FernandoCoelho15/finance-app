import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

function App() {
  const [saldo, setSaldo] = useState(0)
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [movimentacoes, setMovimentacoes] = useState([])
  const [mesSelecionado, setMesSelecionado] = useState('')

  const [formaPagamento, setFormaPagamento] = useState('dinheiro')
  const [parcelas, setParcelas] = useState(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)

  const [editandoId, setEditandoId] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busca, setBusca] = useState('')

  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)

  const [salvando, setSalvando] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const [metaGastosFixos, setMetaGastosFixos] = useState(50)
const [metaLazer, setMetaLazer] = useState(15)
const [metaInvestimentos, setMetaInvestimentos] = useState(15)
const [metaCasaCarro, setMetaCasaCarro] = useState(10)
const [metaReserva, setMetaReserva] = useState(10)

  const [metasFinanceiras, setMetasFinanceiras] =
  useState({
    'Gastos Fixos': 50,
    'Lazer': 15,
    'Investimentos': 15,
    'Casa/Carro': 10,
    'Reserva Emergência': 10
  })

  const COLORS = ['#22c55e', '#ef4444']

function getMesFatura(item) {
  const data = new Date(
  item.data_compra || item.created_at
)

  let mes = data.getMonth() + 1
  let ano = data.getFullYear()

  const dia = data.getDate()

  // fechamento da fatura
  const fechamentoCartao = 26

  if (item.forma_pagamento === 'credito') {

    // compra após fechamento
    if (dia > fechamentoCartao) {
      mes += 2
    } else {
      mes += 1
    }

    // ajuste de virada de ano
    while (mes > 12) {
      mes -= 12
      ano += 1
    }
  }

  return `${ano}-${String(mes).padStart(2, '0')}`
}

  // LOGIN
  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    setUser(data.user)
  }

  async function cadastrar() {

  const { error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    alert(error.message)
    return
  }

  alert('Conta criada com sucesso!')

}

  // CHECK USER
  useEffect(() => {
  async function checkUser() {
    try {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.log('Erro auth:', error)
        setUser(null)
      } else {
        setUser(data?.user ?? null)
      }

    } catch (err) {
      console.log('Erro geral auth:', err)
      setUser(null)
    } finally {
      setCarregando(false)
    }
  }

  checkUser()
}, [])

  // LOGOUT
  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setMovimentacoes([])
  }

async function carregarMetas() {

  if (!user?.id) return

  const { data, error } = await supabase
    .from('metas_usuario')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.log(error)
    return
  }

  if (!data) {

    const { error: erroInsert } =
      await supabase
        .from('metas_usuario')
        .insert([
          {
            user_id: user.id
          }
        ])

    if (erroInsert) {
      console.log(erroInsert)
      return
    }

    carregarMetas()
    return
  }

  setMetasFinanceiras({
    'Gastos Fixos': Number(data.gastos_fixos),
    'Lazer': Number(data.lazer),
    'Investimentos': Number(data.investimentos),
    'Casa/Carro': Number(data.casa_carro),
    'Reserva Emergência':
      Number(data.reserva_emergencia)
  })
  setMetaGastosFixos(Number(data.gastos_fixos))
setMetaLazer(Number(data.lazer))
setMetaInvestimentos(Number(data.investimentos))
setMetaCasaCarro(Number(data.casa_carro))
setMetaReserva(Number(data.reserva_emergencia))
 }

 async function salvarMetas() {

  const total =
  Number(metaGastosFixos) +
  Number(metaLazer) +
  Number(metaInvestimentos) +
  Number(metaCasaCarro) +
  Number(metaReserva)

if (total !== 100) {
  alert(
    `A soma das metas deve ser 100%. Atual: ${total}%`
  )
  return
}

  const { error } = await supabase
    .from('metas_usuario')
    .update({
      gastos_fixos: Number(metaGastosFixos),
      lazer: Number(metaLazer),
      investimentos: Number(metaInvestimentos),
      casa_carro: Number(metaCasaCarro),
      reserva_emergencia: Number(metaReserva)
    })
    .eq('user_id', user.id)

  if (error) {
    console.log(error)
    alert('Erro ao salvar metas')
    return
  }

  await carregarMetas()

  alert('Metas salvas com sucesso!')
}

  // BUSCAR MOVIMENTAÇÕES
async function carregarMovimentacoes() {
  try {
    setCarregando(true)

    if (!user) return

    const { data, error } = await supabase
  .from('movimentacoes')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
      alert('Erro ao carregar movimentações')
      return
    }

    setMovimentacoes(data || [])

  } catch (err) {
    console.log(err)
  } finally {
    setCarregando(false)
  }
}

  // CARREGAR AO ENTRAR
 useEffect(() => {
  if (user) {
    carregarMovimentacoes()
    carregarMetas()
  }
}, [user])


const metasCalculadas = {
  'Gastos Fixos':
    (totalReceitas * metasFinanceiras['Gastos Fixos']) / 100,

  'Lazer':
    (totalReceitas * metasFinanceiras['Lazer']) / 100,

  'Investimentos':
    (totalReceitas * metasFinanceiras['Investimentos']) / 100,

  'Casa/Carro':
    (totalReceitas * metasFinanceiras['Casa/Carro']) / 100,

  'Reserva Emergência':
    (totalReceitas * metasFinanceiras['Reserva Emergência']) / 100
}


// GRÁFICO
const dadosGrafico = [
  { name: 'Receitas', value: totalReceitas },
  { name: 'Despesas', value: totalDespesas }
  
]
const economiaMes = totalReceitas - totalDespesas

const taxaEconomia =
  totalReceitas > 0
    ? (economiaMes / totalReceitas) * 100
    : 0

    let statusFinanceiro = 'Boa'
let emojiFinanceiro = '🟡'

if (taxaEconomia >= 20) {
  statusFinanceiro = 'Excelente'
  emojiFinanceiro = '🟢'
}

if (taxaEconomia < 0) {
  statusFinanceiro = 'Atenção'
  emojiFinanceiro = '🔴'
}
  // ADICIONAR RECEITA
async function adicionarReceita() {
  if (salvando) return

  setSalvando(true)  

  if (!descricao.trim()) {
  alert('Informe uma descrição')
  setSalvando(false)
  return
}

if (!valor || Number(valor) <= 0) {
  alert('Informe um valor válido')
  setSalvando(false)
  return
}

if (!categoria) {
  alert('Selecione uma categoria')
  setSalvando(false)
  return
}
  const { data, error } = await supabase
    .from('movimentacoes')
    .insert([
      {
        descricao: descricao.trim(),
        valor: Number(valor).toFixed(2),
        tipo: 'receita',
        categoria: categoria.trim(),
        forma_pagamento: formaPagamento,
        parcelas: Number(parcelas),
        user_id: user.id
      }
    ])

  if (error) {
    console.log(error)
    alert(error.message)
    setSalvando(false)
    return
  }

  limparCampos()
  carregarMovimentacoes()
  setSalvando(false)
}

// ADICIONAR DESPESA
async function adicionarDespesa() {

  if (salvando) return

  setSalvando(true)

if (!descricao.trim()) {
  alert('Informe uma descrição')
  setSalvando(false)
  return
}

if (!valor || Number(valor) <= 0) {
  alert('Informe um valor válido')
  setSalvando(false)
  return
}

if (!categoria) {
  alert('Selecione uma categoria')
  setSalvando(false)
  return
}
  const valorParcela =
  Number(valor) / Number(parcelas)

const movimentacoesParceladas = []

for (let i = 1; i <= parcelas; i++) {

  const dataParcela = new Date()

dataParcela.setMonth(
  dataParcela.getMonth() + (i - 1)
)

  movimentacoesParceladas.push({
    data_compra: dataParcela,
    descricao:
      parcelas > 1
        ? `${descricao.trim()} (${i}/${parcelas})`
        : descricao.trim(),

    valor: valorParcela.toFixed(2),

    tipo: 'despesa',

    categoria: categoria.trim(),

    forma_pagamento: formaPagamento,

    parcelas: Number(parcelas),

    user_id: user.id
  })
}

const { data, error } = await supabase
  .from('movimentacoes')
  .insert(movimentacoesParceladas)

  if (error) {
    console.log(error)
    alert(error.message)
    setSalvando(false)
    return
  }

  limparCampos()
  carregarMovimentacoes()
  setSalvando(false)
}

  // EDITAR
  async function salvarEdicao(tipo) {
    await supabase
      .from('movimentacoes')
      .update({
        descricao,
        valor: Number(valor),
        categoria
      })
      .eq('id', editandoId)

    setEditandoId(null)

    limparCampos()
    carregarMovimentacoes()
  }

  // EXCLUIR
 async function excluirMovimentacao(id) {

  const confirmar = window.confirm(
    'Deseja realmente excluir esta movimentação?'
  )

  if (!confirmar) return

  await supabase
    .from('movimentacoes')
    .delete()
    .eq('id', id)

  carregarMovimentacoes()
}

  // LIMPAR
  function limparCampos() {
    setDescricao('')
    setValor('')
    setCategoria('')
    setParcelas(1)
setFormaPagamento('dinheiro')
  }

  const movimentacoesFiltradas = movimentacoes.filter((item) => {
  const descricao = item.descricao || ''
  const categoria = item.categoria || ''

  const filtroCat =
    !filtroCategoria ||
    categoria === filtroCategoria

  const filtroBusca =
    descricao.toLowerCase().includes(busca.toLowerCase())

  const filtroMes =
    !mesSelecionado ||
    getMesFatura(item) === mesSelecionado

  return filtroCat && filtroBusca && filtroMes
})

const gastosPorCategoria = {
  'Gastos Fixos': 0,
  'Lazer': 0,
  'Investimentos': 0,
  'Casa/Carro': 0,
  'Reserva Emergência': 0
}

movimentacoesFiltradas.forEach((item) => {
  if (
    item.tipo === 'despesa' &&
    gastosPorCategoria[item.categoria] !== undefined
  ) {
    gastosPorCategoria[item.categoria] += Number(item.valor)
  }
})

const dadosCategorias = Object.entries(
  gastosPorCategoria
)
  .filter(([, valor]) => valor > 0)
  .map(([categoria, valor]) => ({
    name: categoria,
    value: valor
  }))

  function formatarMes(mes) {

  const [ano, numeroMes] = mes.split('-')

  const nomesMeses = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez'
  ]

  return `${nomesMeses[Number(numeroMes) - 1]}/${ano}`
}
  const resumoMensal = {}

movimentacoes.forEach((item) => {

  const chave = getMesFatura(item)

  if (!resumoMensal[chave]) {
    resumoMensal[chave] = {
      receitas: 0,
      despesas: 0
    }
  }

  if (item.tipo === 'receita') {
    resumoMensal[chave].receitas +=
      Number(item.valor)
  } else {
    resumoMensal[chave].despesas +=
      Number(item.valor)
  }
})

const mesesComparativo =
  Object.entries(resumoMensal)
    .sort((a, b) => b[0].localeCompare(a[0]))

useEffect(() => {
  let receitas = 0
  let despesas = 0
  let total = 0

  movimentacoesFiltradas.forEach((item) => {
    const v = Number(item.valor)

    if (item.tipo === 'receita') {
      receitas += v
      total += v
    } else {
      despesas += v
      total -= v
    }
  })

  setTotalReceitas(receitas)
  setTotalDespesas(despesas)
  setSaldo(total)

}, [movimentacoesFiltradas])

if (carregando) {
  return (
    <div style={{ padding: 30 }}>
      <h2>Carregando...</h2>
    </div>
  )
}

  // LOGIN SCREEN
 if (!user) {
  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          display: 'block',
          marginBottom: 10,
          padding: 10
        }}
      />

      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          display: 'block',
          marginBottom: 10,
          padding: 10
        }}
      />

      <button
        onClick={login}
        style={{
          background: 'green',
          color: 'white',
          padding: 10,
          border: 'none',
          borderRadius: 5
        }}
      >
        Entrar
      </button>

      <button
        onClick={cadastrar}
        style={{
          background: '#3b82f6',
          color: 'white',
          padding: 10,
          border: 'none',
          borderRadius: 5,
          marginLeft: 10
        }}
      >
        Criar Conta
      </button>

    </div>
  )
}
  // APP
  return (
    <div
      style={{
        padding: 20,
        fontFamily: 'Arial',
        color: 'white',
        background: '#0f172a',
        minHeight: '100vh'
      }}
    >
      
{/* FILTRO DE MÊS */}
<input
  type="month"
  value={mesSelecionado}
  onChange={(e) => setMesSelecionado(e.target.value)}
/>
      
   <h1
  style={{
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20
  }}
>
  Controle Financeiro
</h1>

      <button
        onClick={logout}
        style={{
          background: 'black',
          color: 'white',
          padding: 10,
          borderRadius: 8,
          marginBottom: 20
        }}
      >
        Sair
      </button>

 {/* SALDO */}
<div
  style={{
    background: '#1e293b',
    padding: 20,
    borderRadius: 10,
    color: '#fff'
  }}
>
  <h2 style={{ color: '#fff', opacity: 0.8 }}>
    Saldo Atual
  </h2>

  <h1 style={{ color: saldo >= 0 ? '#22c55e' : '#ef4444' }}>
    R$ {saldo.toFixed(2)}
  </h1>
</div>

{/* DASHBOARD MENSAL */}
<div
  style={{
    background: '#1e293b',
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  }}
>
  <h2>Resumo do Mês</h2>

  <div style={{ marginTop: 10 }}>
    Receitas: R$ {totalReceitas.toFixed(2)}
  </div>

  <div>
    Despesas: R$ {totalDespesas.toFixed(2)}
  </div>

  <div
    style={{
      color:
        economiaMes >= 0
          ? '#22c55e'
          : '#ef4444',
      fontWeight: 'bold'
    }}
  >
    Economizado: R$ {economiaMes.toFixed(2)}
  </div>

  <div>
    Taxa de Economia:
    {' '}
    {taxaEconomia.toFixed(0)}%
  </div>
</div>
<div
  style={{
    marginTop: 10,
    fontWeight: 'bold'
  }}
>
  Saúde Financeira:
  {' '}
  {emojiFinanceiro}
  {' '}
  {statusFinanceiro}
</div>

<div
  style={{
    marginTop: 10,
    color: '#94a3b8'
  }}
>
  {taxaEconomia >= 20 &&
    'Excelente mês! Você conseguiu economizar uma parte importante da sua renda.'}

  {taxaEconomia >= 0 &&
    taxaEconomia < 20 &&
    'Mês positivo, mas existe espaço para aumentar sua capacidade de economia.'}

  {taxaEconomia < 0 &&
    'Atenção: suas despesas ultrapassaram suas receitas neste período.'}
</div>

      {/* CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 20
        }}
      >
        <div
          style={{
            background: '#1e293b',
            padding: 15,
            borderRadius: 10
          }}
        >
          <h3>Receitas</h3>

          <h2 style={{ color: 'green' }}>
            R$ {totalReceitas.toFixed(2)}
          </h2>
        </div>

        <div
          style={{
            background: '#1e293b',
            padding: 15,
            borderRadius: 10
          }}
        >
          <h3>Despesas</h3>

          <h2 style={{ color: 'red' }}>
            R$ {totalDespesas.toFixed(2)}
          </h2>
        </div>
      </div>
      {/* METAS FINANCEIRAS */}
<div
  style={{
    background: '#1e293b',
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  }}
>
  <h2 style={{ marginBottom: 15 }}>
    Planejamento Financeiro
  </h2>

  <div style={{ color: 'white', marginBottom: 10 }}>
  Teste Meta Gastos Fixos: {metaGastosFixos}
</div>

<div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>

  <input
    type="number"
    value={metaGastosFixos}
    onChange={(e) => setMetaGastosFixos(e.target.value)}
    placeholder="Gastos Fixos %"
    style={{ padding: 8 }}
  />

  <input
    type="number"
    value={metaLazer}
    onChange={(e) => setMetaLazer(e.target.value)}
    placeholder="Lazer %"
    style={{ padding: 8 }}
  />

  <input
    type="number"
    value={metaInvestimentos}
    onChange={(e) => setMetaInvestimentos(e.target.value)}
    placeholder="Investimentos %"
    style={{ padding: 8 }}
  />

  <input
    type="number"
    value={metaCasaCarro}
    onChange={(e) => setMetaCasaCarro(e.target.value)}
    placeholder="Casa/Carro %"
    style={{ padding: 8 }}
  />

  <input
    type="number"
    value={metaReserva}
    onChange={(e) => setMetaReserva(e.target.value)}
    placeholder="Reserva Emergência %"
    style={{ padding: 8 }}
  />

</div>

<button
  onClick={salvarMetas}
  style={{
    background: '#22c55e',
    color: 'white',
    padding: 10,
    border: 'none',
    borderRadius: 6,
    marginBottom: 20,
    cursor: 'pointer'
  }}
>
  Salvar Metas
</button>

{Object.entries(metasCalculadas).map(
  ([categoria, meta]) => {

    const gasto =
      gastosPorCategoria[categoria] || 0

    const percentual =
      meta > 0
        ? (gasto / meta) * 100
        : 0

    return (
      <div
        key={categoria}
        style={{
          marginBottom: 12,
          padding: 10,
          background: '#0f172a',
          borderRadius: 8
        }}
      >
        <strong>{categoria}</strong>

        <div style={{ marginTop: 5 }}>
          Meta: R$ {meta.toFixed(2)}
        </div>

        <div>
          Gasto: R$ {gasto.toFixed(2)}
        </div>

        <div>
  {gasto <= meta
    ? `Restante: R$ ${(meta - gasto).toFixed(2)}`
    : `Excedente: R$ ${(gasto - meta).toFixed(2)}`}
</div>

        <div
          style={{
            color:
              percentual > 100
                ? '#ef4444'
                : '#22c55e',
            fontWeight: 'bold'
          }}
        >
          Utilizado: {percentual.toFixed(0)}%
        </div>

        <div
          style={{
            width: '100%',
            height: 10,
            background: '#334155',
            borderRadius: 10,
            marginTop: 8
          }}
        >
          <div
            style={{
              width: `${Math.min(percentual, 100)}%`,
              height: '100%',
             background:
  percentual > 100
    ? '#ef4444'
    : percentual >= 80
    ? '#eab308'
    : '#22c55e',
              borderRadius: 10
            }}
          />
        </div>

        {percentual > 100 && (
          <div
            style={{
              color: '#ef4444',
              marginTop: 5
            }}
          >
            ⚠ Acima da meta
          </div>
        )}
      </div>
    )
  }
)}
</div>

      {/* FORM */}
      <div
        style={{
          background: '#1e293b',
          padding: 20,
          borderRadius: 10,
          marginTop: 20
        }}
      >
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 10
          }}
        />

        <select
  value={formaPagamento}
  onChange={(e) => setFormaPagamento(e.target.value)}
  style={{
    width: '100%',
    padding: 10,
    marginBottom: 10
  }}
>
  <option value="dinheiro">Dinheiro</option>
  <option value="debito">Débito</option>
  <option value="credito">Crédito</option>
</select>

{formaPagamento === 'credito' ? (
  <input
    type="number"
    placeholder="Parcelas"
    value={parcelas}
    onChange={(e) => setParcelas(e.target.value)}
    min="1"
    style={{
      width: '100%',
      padding: 10,
      marginBottom: 10
    }}
  />
) : null}

<input
  type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 10
          }}
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 10
          }}
        >
       <option value="">Categoria</option>
<option value="Salário">Salário</option>
<option value="Gastos Fixos">Gastos Fixos</option>
<option value="Lazer">Lazer</option>
<option value="Investimentos">Investimentos</option>
<option value="Casa/Carro">Casa/Carro</option>
<option value="Reserva Emergência">
  Reserva Emergência
</option>
<option value="Outros">Outros</option>
        </select>

        {editandoId ? (
          <button
            onClick={salvarEdicao}
            style={{
              background: 'orange',
              color: 'white',
              padding: 10,
              border: 'none',
              borderRadius: 5
            }}
          >
            Salvar edição
          </button>
        ) : (
          <>
            <button
              onClick={adicionarReceita}
              style={{
                background: 'green',
                color: 'white',
                padding: 10,
                marginRight: 10,
                border: 'none',
                borderRadius: 5
              }}
            >
              + Receita
            </button>

            <button
              onClick={adicionarDespesa}
              style={{
                background: 'red',
                color: 'white',
                padding: 10,
                border: 'none',
                borderRadius: 5
              }}
            >
              - Despesa
            </button>
          </>
        )}
      </div>

{/* MOVIMENTAÇÕES */}
<div
  style={{
    background: '#1e293b',
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  }}
>
  <h2 style={{ color: 'black' }}>
    Movimentações
  </h2>

  <input
    placeholder="Buscar movimentação..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    style={{
      width: '100%',
      padding: 10,
      marginBottom: 15,
      background: '#0f172a',
      color: 'white',
      border: '1px solid #334155',
      borderRadius: 8
    }}
  />

  <select
    value={filtroCategoria}
    onChange={(e) => setFiltroCategoria(e.target.value)}
    style={{
      width: '100%',
      padding: 10,
      marginBottom: 15
    }}
  >
    <option value="">Todas categorias</option>
<option value="Salário">Salário</option>
<option value="Gastos Fixos">Gastos Fixos</option>
<option value="Lazer">Lazer</option>
<option value="Investimentos">Investimentos</option>
<option value="Casa/Carro">Casa/Carro</option>
<option value="Reserva Emergência">
  Reserva Emergência
</option>
<option value="Outros">Outros</option>
  </select>

  {movimentacoesFiltradas.map((item) => (
    <div
      key={item.id}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottom: '1px solid #eee'
      }}
    >
      <div>
        <strong style={{ color: 'white' }}>
          {item.descricao}
        </strong>

        <br />

        <small style={{ color: '#555' }}>
          {item.categoria}
        </small>
        <br />

<small style={{ color: '#94a3b8' }}>
  {item.forma_pagamento}

  {item.parcelas > 1
    ? ` • ${item.parcelas}x`
    : ''}
</small>

        <br />

        <span
          style={{
            color:
              item.tipo === 'receita'
                ? 'green'
                : 'red'
          }}
        >
          {item.tipo === 'receita' ? '+' : '-'}
          {' '}R$ {item.valor}
        </span>
      </div>

      <div>
        <button
          onClick={() => {
            setDescricao(item.descricao)
            setValor(item.valor)
            setCategoria(item.categoria)
            setEditandoId(item.id)
          }}
          style={{
            background: 'orange',
            color: 'white',
            border: 'none',
            padding: 8,
            borderRadius: 5,
            marginRight: 10,
            cursor: 'pointer'
          }}
        >
          Editar
        </button>

        <button
          onClick={() =>
            excluirMovimentacao(item.id)
          }
          style={{
            background: 'red',
            color: 'white',
            border: 'none',
            padding: 8,
            borderRadius: 5,
            cursor: 'pointer'
          }}
        >
          Excluir
        </button>
      </div>
    </div>
  ))}
</div>

      {/* GRÁFICO */}
      <div
        style={{
          background: '#1e293b',
          padding: 20,
          borderRadius: 10,
          marginTop: 20,
          height: 300
        }}
      >
        <h2>Resumo Financeiro</h2>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dadosGrafico}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {dadosGrafico.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div
  style={{
    background: '#1e293b',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    height: 350
  }}
>
  <h2>Gastos por Categoria</h2>

  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={dadosCategorias}
        cx="50%"
        cy="50%"
        outerRadius={100}
        dataKey="value"
        label
      >
        {dadosCategorias.map((entry, index) => (
          <Cell
            key={index}
            fill={
              [
                '#22c55e',
                '#3b82f6',
                '#eab308',
                '#ef4444',
                '#8b5cf6'
              ][index % 5]
            }
          />
        ))}
      </Pie>

      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>

{/* COMPARATIVO MENSAL */}
<div
  style={{
    background: '#1e293b',
    padding: 20,
    borderRadius: 10,
    marginTop: 20
  }}
>
  <h2>Comparativo Mensal</h2>

  {mesesComparativo.map(([mes, dados]) => {

    const economia =
      dados.receitas - dados.despesas

    return (
      <div
        key={mes}
        style={{
          padding: 10,
          marginTop: 10,
          background: '#0f172a',
          borderRadius: 8
        }}
      >
       <strong style={{ fontSize: 18 }}>
  📅 {formatarMes(mes)}
</strong>

<div
  style={{
    color: '#22c55e',
    marginTop: 8
  }}
>
  💰 Receitas: R$ {dados.receitas.toFixed(2)}
</div>

<div
  style={{
    color: '#ef4444'
  }}
>
  💸 Despesas: R$ {dados.despesas.toFixed(2)}
</div>

        <div
          style={{
            color:
              economia >= 0
                ? '#22c55e'
                : '#ef4444',
            fontWeight: 'bold'
          }}
        >
          📈 Resultado: R$ {economia.toFixed(2)}
        </div>
      </div>
    )
  })}
</div>

    </div>
  )
}

export default App
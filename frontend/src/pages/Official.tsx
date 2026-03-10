import React from 'react'
import { API_BASE, UPLOAD_BASE, API_TERMS, API_HISTORY } from '../utils/api'


const CATEGORY_ORDER = [
  'Executive','Jumuiya Coordinators','Bible Coordinators','Rosary','Pamphlet Managers','Project Managers','Liturgist','Choir Officials','Instrument Managers','Liturgical Dancers','Catechist'
]


const CATEGORY_COLORS: Record<string, string> = {
  'Executive': 'from-purple-600 to-purple-700',
  'Jumuiya Coordinators': 'from-blue-600 to-blue-700',
  'Bible Coordinators': 'from-green-600 to-green-700',
  'Rosary': 'from-pink-600 to-pink-700',
  'Pamphlet Managers': 'from-orange-600 to-orange-700',
  'Project Managers': 'from-indigo-600 to-indigo-700',
  'Liturgist': 'from-cyan-600 to-cyan-700',
  'Choir Officials': 'from-red-600 to-red-700',
  'Instrument Managers': 'from-blue-600 to-blue-700',
  'Liturgical Dancers': 'from-blue-600 to-blue-700',
  'Catechist': 'from-yellow-600 to-yellow-700'
}

const POSITION_BY_CATEGORY: Record<string,string[]> = {
  'Executive': ['Chairperson','Vice Chairperson','Organizing Secretary','Treasurer','Secretary','Assistant Secretary'],
  'Jumuiya Coordinators': ['Jumuiya Coordinator','Assistant Jumuiya Coordinator'],
  'Bible Coordinators': ['Bible Study Coordinator','Assistant Bible Study Coordinator'],
  'Rosary': ['Rosary Coordinator','Assistant Rosary Coordinator'],
  'Pamphlet Managers': ['Pamphlet Manager','Assistant Pamphlet Manager'],
  'Project Managers': ['Project Manager','Assistant Project Manager'],
  'Liturgist': ['Liturgist','Assistant Liturgist'],
  'Choir Officials': ['Choir Chairperson','Choir Vice Chairperson'],
  'Instrument Managers': ['Instrument Manager','Assistant Instrument Manager'],
  'Liturgical Dancers': ['Dance Coordinator','Assistant Dance Coordinator'],
  'Catechist': ['Catechist']
}

// Position ranking for sorting (lower number = higher rank/superiority)
const POSITION_RANK: Record<string, number> = {}
Object.values(POSITION_BY_CATEGORY).forEach((positions, catIdx) => {
  positions.forEach((pos, idx) => {
    POSITION_RANK[pos] = catIdx * 100 + idx // Category group + position within category
  })
})



export default function Official(){
  const [data,setData] = React.useState<any[]>([])
  const [loading,setLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState('')
  
  // Election terms state for normal users
  const [electionTerms, setElectionTerms] = React.useState<any[]>([])
  const [selectedTermId, setSelectedTermId] = React.useState<number | null>(null)
  const [viewMode, setViewMode] = React.useState<'current' | 'history'>('current')

  React.useEffect(()=>{ 
    fetchOfficials() 
    fetchElectionTerms()
  },[])

  async function fetchElectionTerms(){
    try{
      const res = await fetch(API_TERMS)
      if(!res.ok) throw new Error(`Server responded ${res.status}`)
      const json = await res.json()
      setElectionTerms(json.data || [])
    }catch(e){
      console.error('Error fetching election terms:', e)
    }
  }


  async function fetchOfficials(termId?: number | null){
    setLoading(true)
    setFetchError('')
    try{
      let url = API_BASE
      if(termId){
        url = `${API_HISTORY}/${termId}`
      }
      const res = await fetch(url)
      if(!res.ok) throw new Error(`Server responded ${res.status}`)
      const json = await res.json()
      setData(json.data || [])
    }catch(e){
      console.error(e)
      setFetchError((e as Error).message || 'Failed to load officials')
    }finally{ setLoading(false) }
  }

  async function handleTermChange(termId: string){
    const id = termId ? parseInt(termId) : null
    setSelectedTermId(id)
    if(id){
      setViewMode('history')
      await fetchOfficials(id)
    }else{
      setViewMode('current')
      await fetchOfficials()
    }
  }


  const grouped = React.useMemo(()=>{
    const map: Record<string, any[]> = {}
    data.forEach(d=>{ const c = d.category||'Other'; (map[c] ||= []).push(d) })
    // Sort each category by position rank (superiority order)
    Object.keys(map).forEach(cat => {
      map[cat].sort((a, b) => {
        const rankA = POSITION_RANK[a.position] ?? 9999
        const rankB = POSITION_RANK[b.position] ?? 9999
        return rankA - rankB
      })
    })
    return map
  },[data])


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Our CSA Officials</h1>
          <p className="text-gray-600 text-sm sm:text-base">Meet our dedicated team members</p>
        </div>


        {fetchError ? (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-red-700 text-center sm:text-left">Unable to load officials: {fetchError}</div>
              <button onClick={()=>fetchOfficials()} className="px-4 py-2 bg-red-600 text-white rounded-lg min-h-touch w-full sm:w-auto">Retry</button>
            </div>
          </div>
        ) : loading? (
          <div className="flex justify-center items-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (

          CATEGORY_ORDER.map(cat=> (
            <section key={cat} className="mb-10 sm:mb-16">
              {/* Category Header */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className={`h-1 w-8 sm:w-12 bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded`}></div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{cat}</h2>
                  <div className={`h-1 w-8 sm:w-12 bg-gradient-to-l ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} rounded`}></div>
                </div>
                <div className="flex justify-center">
                  <span className={`inline-block px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'}`}>
                    {(grouped[cat]||[]).length} member{(grouped[cat]||[]).length!==1?'s':''}
                  </span>
                </div>
              </div>

              {/* Cards Grid - Responsive */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">








                {(grouped[cat]||[]).length===0 ? (
                  <div className="w-full flex justify-center py-8 sm:py-12">
                    <p className="text-gray-500 text-base sm:text-lg">No members in this category</p>
                  </div>
                ) : (grouped[cat]||[]).map(off=> (
                  <article key={off.id} className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden w-[calc(50%-0.5rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1.125rem)] max-w-sm">

                    {/* Photo Container */}
                    <div className="relative h-36 sm:h-44 md:h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                      <img
                        src={off.photo? `${UPLOAD_BASE}/${off.photo}` : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ccircle cx="50" cy="35" r="15" fill="%239ca3af"/%3E%3Cpath d="M20 100 Q20 70 50 70 Q80 70 80 100" fill="%239ca3af"/%3E%3C/svg%3E'}
                        alt={off.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 text-center">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-purple-600 transition-colors truncate">{off.name}</h3>
                      <p className={`text-xs sm:text-sm font-semibold bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} bg-clip-text text-transparent mt-2`}>
                        {off.position || off.category}
                      </p>

{/* Contact Button - Mobile: Call, Larger screens: WhatsApp */}
                      {off.contact && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                          {/* Mobile: Call button (visible on screens smaller than lg) */}
                          <a
                            href={`tel:${off.contact.replace(/[^+0-9]/g,'')}`}
                            className={`lg:hidden inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} text-white font-medium text-xs sm:text-sm hover:shadow-lg transition-shadow w-auto`}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.418 1.738 1.707 3.027 3.445 3.445l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 4 14.18 4 9.5S7.82 2 12.5 2h2a1 1 0 011 1v2.153z"></path>
                            </svg>
                            Call
                          </a>
                          
                          {/* Larger screens: WhatsApp button (visible on lg and above) */}
                          <a
                            href={`https://wa.me/${off.contact.replace(/[^+0-9]/g,'')}?text=Hi`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`hidden lg:inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${CATEGORY_COLORS[cat] || 'from-gray-600 to-gray-700'} text-white font-medium text-xs sm:text-sm hover:shadow-lg transition-shadow w-auto`}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                            </svg>
                            WhatsApp
                          </a>
                        </div>
                      )}


                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}


        {/* Term Selection for Normal Users - Compact Design */}
        {electionTerms.length > 0 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 px-3 py-2 bg-white rounded-lg shadow border border-gray-200 w-fit mx-auto">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              <select
                value={selectedTermId || ''}
                onChange={(e) => handleTermChange(e.target.value)}
                className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Current Officials</option>
                {electionTerms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name} ({term.year})
                  </option>
                ))}
              </select>
            </div>
            
            {viewMode === 'history' && selectedTermId && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">|</span>
                <span className="font-medium text-purple-700">
                  {electionTerms.find(t => t.id === selectedTermId)?.name}
                </span>
                <button 
                  onClick={() => handleTermChange('')}
                  className="text-xs text-purple-600 hover:text-purple-800 underline px-1"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

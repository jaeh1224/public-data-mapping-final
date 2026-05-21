import React, { useState, useEffect } from 'react';

export default function App() {
  const [reports, setReports] = useState([]);
  const [openReports, setOpenReports] = useState({});
  const [activeReportIdx, setActiveReportIdx] = useState(null);

  const [currentMenu, setCurrentMenu] = useState('자료검색');
  const menuItems = ['자료검색', '자료분석', '챗봇'];

  const defaultCards = [
    { id: 1, title: '경기도 정류소별 승하차 인원 정보', subtitle: '경기도 교통정보센터', content: '경기도 내 버스정류소별 시간대별 승하차 승객 수 집계 데이터입니다. 대중교통 이용 패턴 분석에 적합합니다.' },
    { id: 2, title: '서울시 공공자전거 이용정보 (시간대별)', subtitle: '서울특별시 교통기획관', content: '따릉이 이용자들의 대여/반납 정류소 및 이용 시간, 이동 거리 데이터를 제공합니다. 환경 및 교통 분석용입니다.' },
    { id: 3, title: '전국 무인교통단속카메라 표준데이터', subtitle: '행정안전부', content: '전국 지자체 및 경찰청에서 관리하는 무인 교통단속 카메라의 위치, 단속 구분, 제한속도 정보입니다.' },
  ];

  const [dummyCards, setDummyCards] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [savedDataByReport, setSavedDataByReport] = useState({});
  const [selectedAnalysisData, setSelectedAnalysisData] = useState(null);

  const [currentSubTab, setCurrentSubTab] = useState('종합');
  const subTabs = ['종합', '통계', '법', '목적', '조직', '도움말'];

  const [chatHistoryByReport, setChatHistoryByReport] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [attachedCapture, setAttachedCapture] = useState(null);

  const [dragPopup, setDragPopup] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [isReportSelectorOpen, setIsReportSelectorOpen] = useState(false);

  const [statTopic, setStatTopic] = useState('');
  const [statMethod, setStatMethod] = useState('auto'); 
  const [statFile, setStatFile] = useState(null);
  const [isStatRunning, setIsStatRunning] = useState(false);

  useEffect(() => {
    if (selectedAnalysisData) {
      setStatTopic(selectedAnalysisData.capturedTopic || '대중교통 이용 패턴 및 거버넌스 인프라 상관관계 분석');
    }
    setStatFile(null);
    setIsStatRunning(false);
  }, [selectedAnalysisData]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText && currentMenu === '자료분석' && selectedAnalysisData) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setDragPopup({
        visible: true,
        x: rect.left + window.scrollX + (rect.width / 2) - 60,
        y: rect.top + window.scrollY - 40,
        text: selectedText
      });
    } else {
      setDragPopup(prev => ({ ...prev, visible: false }));
    }
  };

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (!e.target.closest('.drag-popup-btn')) {
        setDragPopup(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const handleAskDragText = () => {
    if (activeReportIdx === null) return;
    setChatInput(`"${dragPopup.text}" 단락을 연구 기획서 가설 논거로 활용하는 가이드를 제공해줘.`);
    setCurrentMenu('챗봇');
    setDragPopup(prev => ({ ...prev, visible: false }));
  };

  const handleScreenCapture = () => {
    if (!selectedAnalysisData) return;
    setAttachedCapture({
      sourceTab: currentSubTab,
      dataTitle: selectedAnalysisData.title,
      timestamp: '방금 전 캡처됨'
    });
    alert(`현재 [${currentSubTab}] 화면 스냅샷이 성공적으로 캡처되어 챗봇창에 대기 연동되었습니다!`);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !attachedCapture) return;

    const currentHistory = chatHistoryByReport[activeReportIdx] || [
      { sender: 'ai', text: '안녕하세요! 현재 수집한 공공데이터와 법령 지표를 기반으로 공모전 제안서 스토리라인을 다듬어 드릴게요.' }
    ];
    const userMessage = { sender: 'user', text: chatInput, capture: attachedCapture ? { ...attachedCapture } : null };

    let aiResponseText = "제시해주신 데이터 가설을 기반으로 정책 제안서의 인과관계 논거 스토리라인을 정교화합니다.";
    const targetTab = attachedCapture ? attachedCapture.sourceTab : currentSubTab;

    if (chatInput.includes("법") || targetTab === "법") {
      aiResponseText = `⚖️ [AI 법률 위계 분석]: 상위 법령의 위임에 기초하여 '광역조례' 계통이 활성화되어 있습니다. 특별법 우선 적용 원칙을 제안서 서론에 배치하세요.`;
    } else if (chatInput.includes("조직") || targetTab === "조직") {
      aiResponseText = `🏢 [AI 조직 거버넌스 분석]: 국가 부처는 제외되며, 경기로 본청 직제 트리에 종속됩니다. 산하 경기교통공사 에이전시의 실무 매핑을 명시하세요.`;
    } else if (chatInput.includes("목적") || targetTab === "목적") {
      aiResponseText = `🎯 [AI 기능·목적 통합 분석]: 거시적 정책 기능 단락에서 미시적 실·국·과 수행 목적성으로 이어지는 수직 플로우를 기반으로 가설 검정 기대효과를 다듬으세요.`;
    }

    const aiMessage = { sender: 'ai', text: aiResponseText };
    setChatHistoryByReport(prev => ({ ...prev, [activeReportIdx]: [...currentHistory, userMessage, aiMessage] }));
    setChatInput('');
    setAttachedCapture(null);
  };

  const handleCreateReport = () => {
    const userInput = window.prompt("새로 생성할 보고서(연구)의 이름을 입력해주세요:", `보고서 ${reports.length + 1}`);
    if (userInput === null) return;
    const finalName = userInput.trim() === "" ? `보고서 ${reports.length + 1}` : userInput.trim();
    const newIdx = reports.length;
    setReports([...reports, finalName]);
    setCurrentMenu('자료검색');
    setOpenReports(prev => ({ ...prev, [newIdx]: true }));
    setActiveReportIdx(newIdx);
    setSavedDataByReport(prev => ({ ...prev, [newIdx]: [] }));
    setSelectedAnalysisData(null); 
    setDummyCards([]);
    setIsSearched(false);
    setSearchQuery('');
    setIsReportSelectorOpen(false);
  };

  const handleDeleteReport = (idx, e) => {
    e.stopPropagation();
    if (window.confirm(`[${reports[idx]}]를 정말 삭제하시겠습니까?`)) {
      const filtered = reports.filter((_, i) => i !== idx);
      setReports(filtered);
      if (filtered.length === 0) setActiveReportIdx(null);
      else setActiveReportIdx(0);
      setSelectedAnalysisData(null);
      setIsReportSelectorOpen(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim() === '') { alert('검색어를 입력해주세요!'); return; }
    setDummyCards(defaultCards);
    setIsSearched(true);
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm("이 검색 카드를 삭제하시겠습니까?")) {
      const updatedCards = dummyCards.filter(card => card.id !== cardId);
      setDummyCards(updatedCards);
      if (updatedCards.length === 0) { setIsSearched(false); setSearchQuery(''); }
    }
  };

  // ⭐ 도움말 탭의 '클래스 특징 및 제공 이유' 맥락을 각 섹션 데이터셋에 정밀하게 투영 보충
  const handleSaveData = (card) => {
    if (activeReportIdx === null) return;
    const currentSaved = savedDataByReport[activeReportIdx] || [];
    if (currentSaved.some(item => item.id === card.id)) { alert("이미 수집되어 보관함에 들어있는 데이터셋입니다."); return; }
    
    const newSavedItem = {
      ...card, 
      isUploaded: false, 
      fileName: '', rows: '-', cols: '-', size: '-',
      capturedTopic: searchQuery.trim() !== '' ? searchQuery : '대중교통 인프라 이용 분석',

      // ⚖️ 법 탭 데이터 보충 (제도적 타당성, 정책 권한 범위 기술)
      lawHierarchy: [
        { tierTitle: '법령', tierContent: '대중교통의 육성 및 이용에 관한 법률 (국가 위임 입법 기틀)' },
        { tierTitle: '광역조례', tierContent: '경기도 여객자동차 운수사업 재정지원 및 개방 조례' },
        { tierTitle: '기초조례', tierContent: '시·군별 대중교통 이용 편의 증진 및 버스정류소 관리 규칙' }
      ],
      activeLawTier: '광역조례', 
      lawDetail: '본 데이터셋은 자치 행정 활동의 제도적 기반이 되는 법적 근거와 상하 위계 구조를 명시합니다. 이용자는 특별법 우선 원칙에 따른 권한 범위와 규제 여부를 검토하여, 연구 기획서의 제도적 타당성을 완벽하게 증명할 수 있습니다.',
      
      // 🎯 목적 탭 데이터 보충 (거시적 기능 -> 미시적 목적 수직 플로우 및 우선순위 단서 명시)
      purposeHierarchy: [
        { type: '거시적 기능 (정부 고유 영역)', title: '정책 분야', content: '지역개발 및 대중교통망 확충 정책 (국가 조직이 존재하는 한 지속되는 본질적·장기적 영역)' },
        { type: '거시적 기능 (정부 고유 영역)', title: '정책 영역 & 대기능', content: '광역 대중교통 체계 불균형 해소 및 데이터 기반 행정 고도화 기능' },
        { type: '미시적 목적 (구체적 목표)', title: '실·국 단위 목적 (도시교통실)', content: '도민 중심의 안전하고 편리한 맞춤형 교통 인프라 공급 및 거버넌스 최적화' },
        { type: '미시적 목적 (구체적 목표)', title: '과 단위 목적 (버스관리과)', content: '실시간 버스 노선 효율화 및 정류소 혼잡도 완화를 통한 대중교통 이용률 제고' },
        { type: '미시적 목적 (구체적 목표)', title: '실행 단위 연계 (법정계획)', content: '지방대중교통계획 연차별 예산 집행 및 실행 사업 중복성 검토 레퍼런스' }
      ],

      // 🏢 조직 탭 데이터 보충 (책임 소재 명확화, 실제 행정 전달 체계 입체화)
      orgHierarchy: [
        { level: 'Level 1', title: '지자체', name: '경기도청 (거버넌스 총괄)' },
        { level: 'Level 2', title: '도지사', name: '경기도지사 (최종 집행권자)' },
        { level: 'Level 3', title: '행정부지사', name: '행정2부지사 (소관 사무 관리)' },
        { level: 'Level 4', title: '실·국 소관', name: '도시교통실 (정책 컨트롤타워)' },
        { level: 'Level 5', title: '과 (주 책임 부서)', name: '버스관리과 (데이터 생산·관리 및 책임 소재 주체)' },
        { level: 'Level 6', title: '산하 에이전시', name: '경기교통공사 (현장 행정 전달 체계 실행단)' }
      ],
      activeOrgLevel: 'Level 5',
      orgDetail: '본 직제 트리는 데이터를 개방하는 주 책임 부서의 행정 계통과 관할 구조를 투명하게 제공합니다. 이를 통해 정책 집행의 책임 소재를 명확히 구명하고, 실제 현장에서 살아 움직이는 행정 전달 체계를 입체적으로 원용하도록 지원합니다.'
    };

    setSavedDataByReport(prev => ({ ...prev, [activeReportIdx]: [...currentSaved, newSavedItem] }));
    alert(`[${card.title}]이(가) 보관함에 성공적으로 담겼습니다!`);
  };

  const handleRemoveSavedData = (dataId, e) => {
    e.stopPropagation();
    if (window.confirm("이 데이터를 분석 보관함에서 삭제하시겠습니까?")) {
      const currentSaved = savedDataByReport[activeReportIdx] || [];
      const filtered = currentSaved.filter(item => item.id !== dataId);
      setSavedDataByReport(prev => ({ ...prev, [activeReportIdx]: filtered }));
      if (selectedAnalysisData && selectedAnalysisData.id === dataId) setSelectedAnalysisData(null);
    }
  };

  const handleRunStatisticalAnalysis = (e) => {
    e.preventDefault();
    if (!statTopic.trim()) { alert("분석하고자 하는 구체적인 연구 주제를 입력해 주세요!"); return; }
    if (!statFile) { alert("통계 검증을 수행할 원본 분석 파일(.csv)을 선택하여 부착해 주세요!"); return; }

    setIsStatRunning(true);
    const currentSaved = savedDataByReport[activeReportIdx] || [];
    const updated = currentSaved.map(item => {
      if (item.id === selectedAnalysisData.id) {
        return { ...item, isUploaded: true, fileName: statFile };
      }
      return item;
    });
    setSavedDataByReport(prev => ({ ...prev, [activeReportIdx]: updated }));
    alert("입력하신 주제와 부착된 원본 소스 데이터를 기반으로 AI 계량 검정 R-Log 모델 연동에 성공했습니다!");
  };

  const currentReportSavedData = activeReportIdx !== null ? (savedDataByReport[activeReportIdx] || []) : [];
  const currentChatHistory = chatHistoryByReport[activeReportIdx] || [{ sender: 'ai', text: '안녕하세요! 현재 수집한 공공데이터와 법령 지표를 기반으로 공모전 제안서 스토리라인을 다듬어 드릴게요.' }];

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans m-0 p-0 overflow-hidden" onMouseUp={handleTextSelection}>
      
      {dragPopup.visible && (
        <button onClick={handleAskDragText} className="drag-popup-btn absolute z-[999] bg-gray-950 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-2xl border-none cursor-pointer hover:bg-blue-600 hidden md:flex items-center gap-1.5 animate-bounce" style={{ left: `${dragPopup.x}px`, top: `${dragPopup.y}px` }}>
          <span>💬</span> 챗봇에서 질문하기
        </button>
      )}

      {/* ================= 💻 PC 고정 사이드바 ================= */}
      <aside className="w-80 bg-white border-r border-gray-200 flex-col p-4 z-10 select-none box-border hidden md:flex">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-xl font-bold">보고서 목록</h2>
          <button onClick={handleCreateReport} className="w-8 h-8 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg border-none shadow-sm cursor-pointer">+</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {reports.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">생성된 보고서가 없습니다.</p>
          ) : (
            reports.map((report, idx) => (
              <div key={idx} className={`border rounded-lg overflow-hidden shadow-sm mb-2 transition-all ${activeReportIdx === idx ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-100'}`}>
                <div 
                  onClick={() => { setActiveReportIdx(idx); setSelectedAnalysisData(null); }}
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${activeReportIdx === idx ? 'bg-blue-50/50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center space-x-3 gap-3">
                    <div className={`w-6 h-6 rounded-full ${activeReportIdx === idx ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <span className={`font-medium text-base ${activeReportIdx === idx ? 'text-blue-700 font-bold' : ''} truncate max-w-[120px]`}>{report}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-sm cursor-pointer" onClick={(e) => { e.stopPropagation(); setOpenReports(prev => ({ ...prev, [idx]: !prev[idx] })); }}>{openReports[idx] ? '▲' : '▼'}</span>
                    <button onClick={(e) => handleDeleteReport(idx, e)} className="text-gray-400 hover:text-red-500 bg-none border-none text-lg cursor-pointer">🗑️</button>
                  </div>
                </div>

                {openReports[idx] && (
                  <div className="bg-white border-t border-gray-100 divide-y divide-gray-50">
                    {menuItems.map((item) => (
                      <div 
                        key={item} 
                        onClick={() => {
                          setActiveReportIdx(idx);
                          setCurrentMenu(item);
                          if (item !== '자료분석') setSelectedAnalysisData(null);
                        }}
                        className={`p-3 pl-12 text-sm cursor-pointer transition-colors ${activeReportIdx === idx && currentMenu === item ? 'bg-blue-100/70 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ================= MAIN DISPLAY VIEWPORT ================= */}
      <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto box-border items-center justify-center relative pb-20 md:pb-8">
        
        {activeReportIdx !== null && (
          <div className="w-full bg-white border border-gray-200 rounded-2xl p-3 flex justify-between items-center md:hidden mb-4 shadow-sm select-none shrink-0 relative z-30">
            <button 
              onClick={() => setIsReportSelectorOpen(!isReportSelectorOpen)}
              className="bg-gray-100 text-gray-900 font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer flex items-center gap-1"
            >
              📂 {reports[activeReportIdx]} <span className="text-[9px] text-gray-400">▼</span>
            </button>
          </div>
        )}

        {activeReportIdx === null ? (
          <div className="w-full max-w-xl text-center bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-md my-auto">
            <div className="text-5xl md:text-6xl mb-6">🚀</div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">공공데이터 매핑 시스템</h1>
            <button onClick={handleCreateReport} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base px-6 md:px-8 py-3.5 md:py-4 rounded-2xl border-none cursor-pointer shadow transition-all">✨ 첫 보고서 생성</button>
          </div>
        ) : (
          <div className="w-full max-w-4xl h-full flex flex-col items-center justify-start">
            
            {/* PC 상단 가이드 브레드크럼 */}
            <div className="w-full border-b border-gray-200 pb-2 mb-4 text-sm text-gray-400 font-medium text-left hidden md:flex justify-between items-center">
              <span>{reports[activeReportIdx]} &gt; {currentMenu} {selectedAnalysisData && ` > ${selectedAnalysisData.title} [${currentSubTab}]`}</span>
              {currentMenu === '자료분석' && selectedAnalysisData && (
                <button onClick={handleScreenCapture} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-sm">📸 현재 대시보드 캡처</button>
              )}
            </div>

            {/* 1. 자료검색 섹션 */}
            {currentMenu === '자료검색' && (
              <div className={`w-full max-w-3xl flex flex-col items-center transition-all duration-500 ease-in-out ${isSearched ? 'mt-2' : 'mt-[10vh] md:mt-[15vh]'}`}>
                <h1 className="font-extrabold tracking-wide text-center text-xl md:text-3xl mb-6">🔎 {reports[activeReportIdx]} 공공데이터 검색</h1>
                <form onSubmit={handleSearch} className="w-full relative mb-4">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="연구 주제 및 검색어를 입력하고 엔터를 누르세요." className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 border-gray-300 rounded-full text-sm md:text-lg shadow-sm focus:outline-none focus:border-blue-600 box-border" />
                  <button type="submit" className="absolute right-5 top-1/2 transform -translate-y-1/2 bg-none border-none text-gray-500 text-base md:text-lg cursor-pointer">🔍</button>
                </form>

                <div className={`w-full space-y-4 md:space-y-6 mt-2 transition-all duration-500 ${isSearched ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                  {dummyCards.map((card) => (
                    <div key={card.id} className="bg-white md:bg-gray-100 rounded-2xl p-5 md:p-6 shadow-sm md:shadow-md relative border border-gray-200 text-left">
                      <button onClick={() => handleDeleteCard(card.id)} className="absolute top-4 right-4 bg-none border-none text-gray-400 hover:text-red-500 text-lg cursor-pointer">🗑️</button>
                      <h3 className="text-base md:text-xl font-bold text-gray-950 mb-1 leading-snug">{card.title}</h3>
                      <p className="text-[11px] md:text-xs text-gray-400 font-semibold mb-4">{card.subtitle}</p>
                      <div className="mb-4 md:mb-6">
                        <span className="font-bold text-xs md:text-base block mb-1">요약</span>
                        <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0">{card.content}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-400">주제 적합도: ★★★☆☆</span>
                        <button onClick={() => handleSaveData(card)} className="bg-gray-900 text-white font-semibold text-xs md:text-sm px-4 md:px-5 py-2 rounded-xl hover:bg-gray-800 border-none cursor-pointer">담기</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 자료분석 섹션 */}
            {currentMenu === '자료분석' && (
              <div className="w-full font-sans text-left select-text h-full overflow-hidden flex flex-col">
                
                {!selectedAnalysisData ? (
                  <div className="w-full mt-2 overflow-y-auto pr-2 flex-1">
                    <div className="mb-6 border-b pb-4 hidden md:block">
                      <h1 className="text-3xl font-extrabold text-gray-900">📊 자료 종합 분석 허브</h1>
                    </div>

                    {currentReportSavedData.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-3xl py-16 text-center text-gray-400 bg-white shadow-sm max-w-3xl mx-auto px-6 text-xs md:text-sm">
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1">수집된 데이터셋이 없습니다</h3>
                        <p className="text-gray-400 leading-relaxed">자료검색 메뉴에서 기획서에 담을 공공데이터를 담아 오세요.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {currentReportSavedData.map((data) => (
                          <div key={data.id} className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm flex flex-col justify-between relative">
                            <div>
                              <div className="flex justify-between items-center mb-2 pr-6">
                                <span className="text-[10px] md:text-xs text-blue-600 font-bold uppercase">{data.subtitle}</span>
                              </div>
                              <button onClick={(e) => handleRemoveSavedData(data.id, e)} className="absolute top-5 right-5 bg-none border-none text-gray-300 hover:text-red-500 text-lg cursor-pointer">🗑️</button>
                              <h3 className="text-base md:text-xl font-bold text-gray-950 mb-6 pr-6 leading-tight">{data.title}</h3>
                            </div>
                            <button onClick={() => { setSelectedAnalysisData(data); setCurrentSubTab('종합'); }} className="w-full font-bold py-2.5 md:py-3 px-4 rounded-xl text-center text-xs md:text-sm border-none cursor-pointer bg-gray-900 text-white hover:bg-gray-800">대시보드 분석 스페이스 진입 ➡️</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  
                  <div className="w-full mt-1 flex-1 flex flex-col overflow-hidden">
                    <button onClick={() => setSelectedAnalysisData(null)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-sm mb-4">⬅️ 자료함 목록으로</button>
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 mb-4 md:mb-6 leading-tight truncate">{selectedAnalysisData.title}</h2>

                    {/* 6대 서브 탭 바 */}
                    <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-4 md:mb-6 gap-1 text-center overflow-x-auto whitespace-nowrap no-scrollbar md:grid md:grid-cols-6 shrink-0">
                      {subTabs.map((tab) => (
                        <button key={tab} onClick={() => setCurrentSubTab(tab)} className={`text-center py-2 md:py-2.5 px-4 md:px-0 text-xs font-bold rounded-lg cursor-pointer transition-all border-none inline-block md:block ${currentSubTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{tab}</button>
                      ))}
                    </div>

                    <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm min-h-[200px] overflow-y-auto pr-2">
                      
                      {currentSubTab === '종합' && (
                        <div className="space-y-3">
                          <h3 className="text-sm md:text-base font-bold text-gray-900 m-0">📜 데이터셋 메타 개요 요약</h3>
                          <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 bg-gray-50 p-4 rounded-xl">本 데이터셋은 행정 목적 달성을 위해 계량 수집된 지표 데이터입니다. 아래 정비된 법률, 거시-미시 목적 체계 및 조직 수직 위계 트리를 교차 검증하여 연구 제안서 논거를 정밀하게 전개하세요.</p>
                        </div>
                      )}

                      {/* 📊 통계 탭 */}
                      {currentSubTab === '통계' && (
                        <div className="space-y-5 max-w-lg mx-auto">
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed font-medium">
                            <span className="font-extrabold block mb-1">🤖 AI 자율 정량 검정 안내</span>
                            데이터분석 방법을 선택하지 않고 신청하실 경우, 인공지능이 부착된 원본 CSV 파일의 데이터 규격을 자율 판독하여 가장 정합성이 높은 사회과학적 통계 분석 모델을 자동 선택하여 가동합니다.
                          </div>

                          <form onSubmit={handleRunStatisticalAnalysis} className="space-y-4 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">1. 데이터분석 연구 주제 <span className="text-red-500">*</span></label>
                              <input 
                                type="text" 
                                value={statTopic} 
                                onChange={(e) => setStatTopic(e.target.value)} 
                                placeholder="분석하고자 하는 세부 연구 가설 주제를 작성하세요." 
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-xs md:text-sm focus:outline-none focus:border-blue-600 box-border font-medium" 
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">2. 통계 원본 소스 파일 부착 (.csv) <span className="text-red-500">*</span></label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  readOnly 
                                  value={statFile ? statFile : '선택된 로컬 파일 없음'} 
                                  className="flex-1 bg-gray-50 border border-gray-300 px-3 py-2 rounded-xl text-xs text-gray-500 font-mono" 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => setStatFile(`raw_data_${selectedAnalysisData.id}_v1.csv`)} 
                                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer text-gray-700 whitespace-nowrap"
                                >
                                  파일 선택
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1.5">3. 희망하는 계량 가설 검정 방법론 (선택)</label>
                              <select 
                                value={statMethod} 
                                onChange={(e) => setStatMethod(e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-600 cursor-pointer font-medium"
                              >
                                <option value="auto">AI가 데이터에 맞춰 자율 선택 (권장)</option>
                                <option value="regression">다중 선형 회귀 분석 (OLS Regression)</option>
                                <option value="anova">분산 분석 (ANOVA Test)</option>
                                <option value="logit">로지스틱 회귀 모델 (Logit model)</option>
                              </select>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm py-3 rounded-xl border-none cursor-pointer shadow-sm transition-all">
                              🚀 AI 통계 검정 모델 및 R-Log 추출 기동
                            </button>
                          </form>

                          {isStatRunning && (
                            <div className="space-y-2 animate-fade">
                              <span className="text-[11px] font-bold text-green-600 block">✓ AI 엔진 연계 계량 검정 출력 완료</span>
                              <pre className="text-[11px] md:text-xs text-green-400 bg-gray-950 p-4 rounded-xl font-mono leading-relaxed overflow-x-auto shadow-inner">
{`> # 분석주제: ${statTopic}
> # 적용공정: ${statMethod === 'auto' ? 'AI 판독형 가설 모델 자율 적용' : statMethod}
> summary(lm(Main_Target ~ Transit_Index + Location_Factor, data = ${statFile}))

Coefficients:
                 Estimate Std. Error t value Pr(>|t|)    
(Intercept)      0.541284   0.114128    4.74 3.12e-05 ***
Transit_Index    0.812450   0.015124   53.73  < 2e-16 ***
Location_Factor  0.241521   0.024151    10.00 1.45e-12 ***`}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ⚖️ 법 탭: 도움말 맥락 기반 텍스트 보강 완료 */}
                      {currentSubTab === '법' && (
                        <div className="space-y-4">
                          <div className="w-full flex flex-col items-center justify-center py-4 select-none max-w-lg mx-auto">
                            <span className="text-xs font-bold text-gray-900 mb-6 tracking-wider">법적 위계 구조</span>
                            <div className="w-full flex flex-col items-center space-y-4 px-8 box-border">
                              {selectedAnalysisData.lawHierarchy.map((item, index) => {
                                const isActive = item.tierTitle === selectedAnalysisData.activeLawTier;
                                return (
                                  <React.Fragment key={item.tierTitle}>
                                    <div className={`w-full text-center transition-all duration-300 rounded-2xl ${
                                      isActive ? 'bg-gray-100/90 border border-gray-300/80 shadow-[0_4px_12px_rgba(0,0,0,0.04)] p-4 scale-[1.02]' : 'text-gray-400 p-2 opacity-50'
                                    }`}>
                                      <div className={`text-sm ${isActive ? 'text-gray-950 font-black' : 'text-gray-500 font-bold'}`}>{item.tierTitle}</div>
                                      <div className={`text-xs mt-1 leading-normal ${isActive ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal'}`}>{item.tierContent}</div>
                                    </div>
                                    {index < selectedAnalysisData.lawHierarchy.length - 1 && <div className="text-gray-300 text-xs py-0.5">▼</div>}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed max-w-lg mx-auto shadow-inner">
                            <p className="font-extrabold text-blue-900 border-b border-gray-200 pb-1.5 mb-2">⚖️ 행정 제도적 타당성 분석 주석</p>
                            <p className="m-0 leading-relaxed font-medium">{selectedAnalysisData.lawDetail}</p>
                          </div>
                        </div>
                      )}

                      {/* 🎯 목적 탭: 도움말 맥락 기반 텍스트 보강 완료 */}
                      {currentSubTab === '목적' && (
                        <div className="space-y-4">
                          <div className="w-full flex flex-col items-center justify-center py-4 select-none max-w-lg mx-auto">
                            <span className="text-xs font-bold text-gray-900 mb-6 tracking-wider">데이터 정책 목표 및 의도 위계 (거시 ➡️ 미시)</span>
                            <div className="w-full flex flex-col items-center space-y-4 px-8 box-border">
                              {selectedAnalysisData.purposeHierarchy.map((item, index) => (
                                <React.Fragment key={index}>
                                  <div className={`w-full transition-all duration-300 rounded-2xl border p-4 shadow-sm ${index < 2 ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${index < 2 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.type}</span>
                                      <span className="text-[11px] text-gray-400 font-medium">{item.title}</span>
                                    </div>
                                    <p className="m-0 text-xs md:text-sm text-gray-900 font-bold leading-normal">{item.content}</p>
                                  </div>
                                  {index < selectedAnalysisData.purposeHierarchy.length - 1 && <div className="text-gray-300 text-xs py-0.5">▼</div>}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 leading-relaxed max-w-lg mx-auto shadow-inner">
                            <p className="font-extrabold text-emerald-900 border-b border-emerald-200 pb-1.5 mb-2">🎯 정책 우선순위 및 기획 수립 단서</p>
                            <p className="m-0 leading-relaxed font-medium text-xs">
                              상단의 거시적 기능 분류 모델을 통해 정부 활동의 본질적·장기적 틀을 추적하고, 하단의 미시적 과 단위 목적과 예산 집행 단위를 매핑하여 새로운 정책 대안을 설계하거나 중복 실행 사업을 사전 필터링하는 강력한 레퍼런스로 작동합니다.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 🏢 조직 탭: 도움말 맥락 기반 텍스트 보강 완료 */}
                      {currentSubTab === '조직' && (
                        <div className="space-y-5">
                          <div className="w-full bg-white border border-gray-200 rounded-2xl p-5 shadow-sm max-w-xl mx-auto box-border">
                            <span className="text-[11px] text-gray-400 font-bold block mb-1">제공 부서 명세</span>
                            <span className="text-2xl font-black text-gray-900 tracking-tight">버스 관리과</span>
                          </div>

                          <div className="w-full flex flex-col items-center justify-center py-2 select-none max-w-lg mx-auto">
                            <span className="text-xs font-bold text-gray-900 mb-6 tracking-wider">행정 책임 부서 수직 직제 체계</span>
                            <div className="w-full flex flex-col items-center space-y-3 px-8 box-border">
                              {selectedAnalysisData.orgHierarchy.map((item, index) => {
                                const isActive = item.level === selectedAnalysisData.activeOrgLevel;
                                return (
                                  <React.Fragment key={item.level}>
                                    <div className={`w-full text-center transition-all duration-300 rounded-2xl ${
                                      isActive ? 'bg-gray-100/90 border border-gray-400 shadow-[0_4px_12px_rgba(0,0,0,0.05)] p-4 scale-[1.02]' : 'text-gray-400 p-2 opacity-50'
                                    }`}>
                                      <div className={`text-[10px] font-bold tracking-wider mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{item.level}</div>
                                      <div className={`text-sm ${isActive ? 'text-gray-950 font-black' : 'text-gray-500 font-bold'}`}>{item.title}</div>
                                      <div className={`text-xs mt-0.5 ${isActive ? 'text-gray-700 font-semibold' : 'text-gray-400 font-normal'}`}>{item.name}</div>
                                    </div>
                                    {index < selectedAnalysisData.orgHierarchy.length - 1 && <div className="text-gray-300 text-xs py-0.5">▼</div>}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                          <p className="p-4 bg-amber-50/40 border border-amber-100 text-xs text-gray-700 rounded-xl max-w-xl mx-auto font-medium leading-relaxed">{selectedAnalysisData.orgDetail}</p>
                        </div>
                      )}

                      {/* 💡 도움말 탭 보드 (기존 유지 복원) */}
                      {currentSubTab === '도움말' && (
                        <div className="space-y-6 text-left animate-fade text-gray-800">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 md:p-5 shadow-sm">
                            <h4 className="text-sm md:text-base font-extrabold text-blue-900 m-0 mb-1 flex items-center gap-1.5">
                              <span>💡</span> 공공데이터 매핑 프레임워크 안내
                            </h4>
                            <p className="text-xs md:text-sm text-blue-700 leading-relaxed m-0 font-medium">
                              본 시스템은 단순 수치 지표의 한계를 넘어, 데이터가 생성되고 집행되는 행정 지형도를 다각도로 연계합니다. 각 분석 클래스(Tab)의 핵심 특징과 활용 목적은 아래와 같습니다.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-gray-100 text-gray-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md">종합</span>
                                <h5 className="text-xs md:text-sm font-bold text-gray-950 m-0">데이터셋 메타 개요 요약</h5>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 pl-1">
                                행정 목적 달성을 위해 계량 수집된 지표 데이터의 기본 명세를 요약합니다. 본격적인 다차원 분석 전 데이터셋의 정량적 정체성을 빠르게 체크하도록 돕습니다.
                              </p>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-100 text-blue-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md">기능</span>
                                <h5 className="text-xs md:text-sm font-bold text-gray-950 m-0">거시적·장기적 정책 영역 분석</h5>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 pl-1">
                                시대가 변해도 국가라는 조직이 존재하는 한 쉽게 바뀌지 않는 정부 고유의 본질적·장기적 업무 영역을 정의합니다. 이용자가 파편화된 데이터 속에서 정부 활동의 큰 틀과 거시적인 흐름을 직관적으로 파악할 수 있도록 돕습니다.
                              </p>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-100 text-purple-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md">법률</span>
                                <h5 className="text-xs md:text-sm font-bold text-gray-950 m-0">제도적 근거 및 법령 위계 분석</h5>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 pl-1">
                                행정 활동의 제도적 기반이 되는 법적 근거와 상하 법령의 위계구조를 제공. 이용자가 해당 데이터와 관련된 정책의 권한 범위, 규제 여부 및 제도적 타당성을 명확히 파악할 수 있도록 도움을 줍니다.
                              </p>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-amber-100 text-amber-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md">조직</span>
                                <h5 className="text-xs md:text-sm font-bold text-gray-950 m-0">생산 주체 및 행정 전달 체계 파악</h5>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 pl-1">
                                데이터를 생산하고 관리하는 주 책임 부서의 행정 계통과 관할 구조를 보여줍니다. 이를 통해 정책 집행의 책임 소재를 명확히 하고, 실제 현장에서 움직이는 행정 전달 체계를 입체적으로 이해하도록 지원합니다.
                              </p>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md">목적</span>
                                <h5 className="text-xs md:text-sm font-bold text-gray-950 m-0">정책적 목표 의도와 가치 위계화</h5>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 pl-1">
                                해당 기관이 해결하고자 하는 구체적인 정책적 목표와 의도의 위계구조를 명시합니다. 정부가 현재 어떤 과제에 우선순위를 두고 있는지 보여줌으로써, 새로운 정책을 기획하거나 객관적인 성과 평가를 할 때 핵심 단서로 활용됩니다.
                              </p>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-rose-100 text-rose-800 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-md">사업</span>
                                <h5 className="text-xs md:text-sm font-bold text-gray-950 m-0">법정계획과 예산 중심의 집행 단위</h5>
                              </div>
                              <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 pl-1">
                                추상적인 정책 목표가 \'법정계획\'과 예산을 통해 실현되는 구체적인 집행 단위를 보여줍니다. 이용자가 기존 실행 사업들과의 유사중복 여부를 검토하거나, 실질적으로 실행 가능한 새로운 기획안을 도출할 때 구체적인 레퍼런스로 활용됩니다.
                              </p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-400 font-medium leading-relaxed">
                            💡 [Tip]: 마우스 드래그를 이용해 우측 챗봇 어시스턴트 창에 스냅샷 가설을 바로 던질 수 있습니다.
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. 챗봇 섹션 */}
            {currentMenu === '챗봇' && (
              <div className="w-full max-w-3xl flex flex-col h-[70vh] md:h-[75vh] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-left shrink-0">
                <div className="bg-gray-950 text-white px-5 py-3.5 flex justify-between items-center select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg">🤖</span>
                    <div>
                      <span className="font-bold text-xs md:text-sm block">연구 매핑 AI 어시스턴트</span>
                      <span className="text-[9px] md:text-[10px] text-green-400 font-medium">● 행정·조직 통합 가설 엔진 가동중</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                  {currentChatHistory.map((msg, mIdx) => (
                    <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm text-xs md:text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                        <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white flex gap-2 shrink-0">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="분석 결과나 행정적 상관관계 가설에 대해 질문하세요..." className="flex-1 px-4 py-2.5 border rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-inner" />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 rounded-xl border-none cursor-pointer">전송</button>
                </form>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ================= 📱 모바일 하단 고정 네비게이션 바 ================= */}
      {activeReportIdx !== null && (
        <nav className="w-full bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 h-16 flex z-40 select-none shadow-xl md:hidden shrink-0">
          {menuItems.map((item) => (
            <button key={item} onClick={() => { setCurrentMenu(item); if (item !== '자료분석') setSelectedAnalysisData(null); }} className={`flex-1 flex flex-col items-center justify-center border-none bg-transparent cursor-pointer ${currentMenu === item ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
              <span className="text-xs tracking-tight">{item}</span>
            </button>
          ))}
        </nav>
      )}

    </div>
  );
}
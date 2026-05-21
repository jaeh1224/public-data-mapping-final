import React, { useState, useEffect } from 'react';

export default function App() {
  const [reports, setReports] = useState([]);
  const [openReports, setOpenReports] = useState({});
  const [activeReportIdx, setActiveReportIdx] = useState(null);

  // 메뉴 관리용 (PC용 서브메뉴 및 모바일용 하단바 공용 내비게이션 상태)
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
  const subTabs = ['종합', '통계', '법', '기능', '목적', '조직', '사업', '도움말'];

  const [chatHistoryByReport, setChatHistoryByReport] = useState({});
  const [chatInput, setChatInput] = useState('');
  const [attachedCapture, setAttachedCapture] = useState(null);

  // Univ AI 스타일 드래그 팝업 좌표
  const [dragPopup, setDragPopup] = useState({ visible: false, x: 0, y: 0, text: '' });
  const [isReportSelectorOpen, setIsReportSelectorOpen] = useState(false);

  // 💻 데스크톱 마우스 드래그 감지 이벤트
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
    setChatInput(`"${dragPopup.text}" -> 이 내용에 대해 사회과학적 관점으로 보완 설명해줘.`);
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
    alert(`현재 대시보드가 캡처되어 챗봇창에 첨부되었습니다!`);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !attachedCapture) return;

    const currentHistory = chatHistoryByReport[activeReportIdx] || [
      { sender: 'ai', text: '안녕하세요! 수집한 공공데이터 분석 결과물과 법령 지표를 기반으로 제안서 스토리라인을 다듬어 드릴게요.' }
    ];

    const userMessage = { sender: 'user', text: chatInput, capture: attachedCapture ? { ...attachedCapture } : null };

    let aiResponseText = "제시해주신 데이터 구조를 분석해 볼 때, 공모전 제안서의 '기대효과' 파트에 소관 법령 지표를 결합하여 서술하는 방식이 심사위원단에 가장 설득력 있게 다가갈 것입니다.";
    if (attachedCapture) {
      aiResponseText = `🤖 [화면 캡처 분석 결과]: 보내주신 [${attachedCapture.dataTitle} > ${attachedCapture.sourceTab}] 스냅샷 인프라를 판독했습니다. 이 구간 수치를 상관관계 가설의 독립변수로 결합해 보세요.`;
    }

    const aiMessage = { sender: 'ai', text: aiResponseText };

    setChatHistoryByReport(prev => ({
      ...prev,
      [activeReportIdx]: [...currentHistory, userMessage, aiMessage]
    }));

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

  const handleSaveData = (card) => {
    if (activeReportIdx === null) return;
    const currentSaved = savedDataByReport[activeReportIdx] || [];
    if (currentSaved.some(item => item.id === card.id)) { alert("이미 수집되어 보관함에 들어있는 데이터셋입니다."); return; }
    
    const newSavedItem = {
      ...card, isUploaded: false, fileName: '', rows: '-', cols: '-', size: '-',
      law: '국토교통부 및 관계 법령에 따른 대중교통 이용 데이터 처리 표준 규격 제14조',
      function: '해당 주무 공공기관의 빅데이터 기반 교통 수요 예측 및 인프라 구축 기능',
      purpose: '민간 거버넌스 개방을 통한 청년 창업 인큐베이팅 및 공공 연구 인프라 활성화',
      org: '공공데이터포털 시스템 품질 거버넌스 관리국',
      business: '2026년도 공공 데이터 매핑 연계 국책 추진 혁신 지표 예산 사업'
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

  const handleSimulateUpload = (dataId) => {
    const currentSaved = savedDataByReport[activeReportIdx] || [];
    const updated = currentSaved.map(item => {
      if (item.id === dataId) { return { ...item, isUploaded: true, fileName: `data_stream_${dataId}.csv`, rows: '54,128', cols: '16', size: '7.8 MB' }; }
      return item;
    });
    setSavedDataByReport(prev => ({ ...prev, [activeReportIdx]: updated }));
    alert("원본 데이터 파일 연동 완료!");
    const target = updated.find(item => item.id === dataId);
    if (selectedAnalysisData && selectedAnalysisData.id === dataId) setSelectedAnalysisData(target);
  };

  // 📱 모바일 터치 전용 퀵 질문 매핑
  const handleQuickAsk = (text) => {
    setChatInput(`"${text}" -> 이 내용의 공모전 제안서 고도화 스토리라인을 다듬어줘.`);
    setCurrentMenu('챗봇');
  };

  const currentReportSavedData = activeReportIdx !== null ? (savedDataByReport[activeReportIdx] || []) : [];
  const currentChatHistory = chatHistoryByReport[activeReportIdx] || [{ sender: 'ai', text: '안녕하세요! 현재 수집한 공공데이터와 법령 지표를 기반으로 공모전 제안서 스토리라인을 다듬어 드릴게요.' }];

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans m-0 p-0 overflow-hidden" onMouseUp={handleTextSelection}>
      
      {/* 💻 PC 전용 Univ AI 스타일 드래그 미니 질문 팝업 단추 */}
      {dragPopup.visible && (
        <button onClick={handleAskDragText} className="drag-popup-btn absolute z-[999] bg-gray-950 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-2xl border-none cursor-pointer hover:bg-blue-600 hidden md:flex items-center gap-1.5 animate-bounce" style={{ left: `${dragPopup.x}px`, top: `${dragPopup.y}px` }}>
          <span>💬</span> 챗봇에서 질문하기
        </button>
      )}

      {/* ================= 💻 PC 전용 고정 사이드바 (모바일에서는 hidden 처리) ================= */}
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
                    <span className="text-gray-500 text-sm">{openReports[idx] ? '▲' : '▼'}</span>
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
        
        {/* 📱 모바일 전용 상단 콤팩트 헤더 바 (PC에서는 hidden 처리) */}
        {activeReportIdx !== null && (
          <div className="w-full bg-white border border-gray-200 rounded-2xl p-3 flex justify-between items-center md:hidden mb-4 shadow-sm select-none shrink-0 relative z-30">
            <button 
              onClick={() => setIsReportSelectorOpen(!isReportSelectorOpen)}
              className="bg-gray-100 text-gray-900 font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer flex items-center gap-1"
            >
              📂 {reports[activeReportIdx]} <span className="text-[9px] text-gray-400">▼</span>
            </button>
            {currentMenu === '자료분석' && selectedAnalysisData && (
              <button onClick={handleScreenCapture} className="bg-gray-900 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg border-none cursor-pointer shadow-sm">📸 캡처</button>
            )}

            {/* 모바일용 드롭다운 프로젝트 팝업 */}
            {isReportSelectorOpen && (
              <div className="absolute left-3 top-14 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 divide-y divide-gray-100">
                <div className="max-h-36 overflow-y-auto pb-1.5">
                  {reports.map((report, idx) => (
                    <div key={idx} onClick={() => { setActiveReportIdx(idx); setSelectedAnalysisData(null); setIsReportSelectorOpen(false); }} className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold cursor-pointer ${activeReportIdx === idx ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span className="truncate max-w-[140px]">{report}</span>
                      <button onClick={(e) => handleDeleteReport(idx, e)} className="text-gray-300 hover:text-red-500 bg-none border-none cursor-pointer">🗑️</button>
                    </div>
                  ))}
                </div>
                <div className="pt-1.5"><button onClick={handleCreateReport} className="w-full bg-blue-600 text-white text-[11px] font-bold py-1.5 rounded-lg border-none cursor-pointer">+ 새 프로젝트 추가</button></div>
              </div>
            )}
          </div>
        )}

        {activeReportIdx === null ? (
          /* [CASE 1] 보고서 전무할 때의 초기 웰컴 홈 대시보드 */
          <div className="w-full max-w-xl text-center bg-white border border-gray-200 rounded-3xl p-8 md:p-12 shadow-md my-auto">
            <div className="text-5xl md:text-6xl mb-6">🚀</div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">공공데이터 매핑 시스템</h1>
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-8">연구 보고서를 새로 등록하여 분석 프로세스를 실시간으로 구성해 보세요.</p>
            <button onClick={handleCreateReport} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm md:text-base px-6 md:px-8 py-3.5 md:py-4 rounded-2xl border-none cursor-pointer shadow transition-all">✨ 첫 보고서 생성하고 시작하기</button>
          </div>
        ) : (
          
          /* [CASE 2] 프로젝트 활성화 상태 */
          <div className="w-full max-w-4xl h-full flex flex-col items-center justify-start">
            
            {/* PC 전용 상단 텍스트 가이드 브레드크럼 */}
            <div className="w-full border-b border-gray-200 pb-2 mb-4 text-sm text-gray-400 font-medium text-left hidden md:flex justify-between items-center">
              <span>{reports[activeReportIdx]} &gt; {currentMenu} {selectedAnalysisData && ` > ${selectedAnalysisData.title} [${currentSubTab}]`}</span>
              {currentMenu === '자료분석' && selectedAnalysisData && (
                <button onClick={handleScreenCapture} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-sm">📸 현재 대시보드 캡처</button>
              )}
            </div>

            {/* 1. 자료검색 섹션 */}
            {currentMenu === '자료검색' && (
              <div className={`w-full max-w-3xl flex flex-col items-center transition-all duration-500 ease-in-out ${isSearched ? 'mt-2' : 'mt-[10vh] md:mt-[15vh]'}`}>
                <h1 className="font-extrabold tracking-wide text-center text-xl md:text-3xl mb-4 md:mb-6">🔎 {reports[activeReportIdx]} 공공데이터 검색</h1>
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
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100 md:border-none">
                        <span className="text-xs font-semibold text-gray-400">주제 적합도: ★★★☆☆ 3/5</span>
                        <button onClick={() => handleSaveData(card)} className="bg-gray-900 text-white font-semibold text-xs md:text-sm px-4 md:px-5 py-2 rounded-xl hover:bg-gray-800 shadow-sm border-none cursor-pointer">담기</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 자료분석 섹션 */}
            {currentMenu === '자료분석' && (
              <div className="w-full font-sans text-left select-text">
                
                {!selectedAnalysisData ? (
                  <div className="w-full mt-2">
                    <div className="mb-6 border-b pb-4 hidden md:block">
                      <h1 className="text-3xl font-extrabold text-gray-900">📊 자료 종합 분석 허브</h1>
                      <p className="text-sm text-gray-500 mt-1">정성 정보는 개방형으로 선제 확인 가능하며, 통계 계량 모델은 파일 장착 시 기동됩니다.</p>
                    </div>

                    {currentReportSavedData.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-3xl py-16 md:py-24 text-center text-gray-400 bg-white shadow-sm max-w-3xl mx-auto px-6 text-xs md:text-sm">
                        <div className="text-4xl md:text-5xl mb-4">📥</div>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1">수집된 데이터셋이 없습니다</h3>
                        <p className="text-gray-400 max-w-md mx-auto leading-relaxed">자료검색 메뉴에서 필요한 공공데이터를 먼저 [담기] 해주세요!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:grid-cols-2 md:gap-6">
                        {currentReportSavedData.map((data) => (
                          <div key={data.id} className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm flex flex-col justify-between relative">
                            <div>
                              <div className="flex justify-between items-center mb-2 pr-6">
                                <span className="text-[10px] md:text-xs text-blue-600 font-bold uppercase">{data.subtitle}</span>
                                <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 rounded-full ${data.isUploaded ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {data.isUploaded ? '● 파일연동완료' : '○ 파일 미부착'}
                                </span>
                              </div>
                              <button onClick={(e) => handleRemoveSavedData(data.id, e)} className="absolute top-5 right-5 bg-none border-none text-gray-300 hover:text-red-500 text-lg cursor-pointer">🗑️</button>
                              <h3 className="text-base md:text-xl font-bold text-gray-950 mb-3 pr-6 leading-tight">{data.title}</h3>
                              
                              <div className="border border-dashed border-gray-200 rounded-xl p-3 md:p-4 bg-gray-50 mb-4 md:mb-6 text-center">
                                {data.isUploaded ? (
                                  <div className="text-xs text-gray-600 font-medium">연동 데이터: <span className="font-mono text-blue-600 font-bold text-xs">{data.fileName}</span></div>
                                ) : (
                                  <div>
                                    <button onClick={() => handleSimulateUpload(data.id)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-[11px] md:text-xs py-1 px-2.5 rounded font-bold shadow-sm">💻 파일 업로드 (.csv)</button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button onClick={() => { setSelectedAnalysisData(data); setCurrentSubTab('종합'); }} className="w-full font-bold py-2.5 md:py-3 px-4 rounded-xl text-center text-xs md:text-sm border-none cursor-pointer bg-gray-900 text-white hover:bg-gray-800">대시보드 분석 스페이스 진입 ➡️</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  
                  /* [CASE 2-B] 8대 마스터 탭 상세 모듈 화면 (반응형 공용 구조) */
                  <div className="w-full mt-1">
                    <button onClick={() => setSelectedAnalysisData(null)} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-sm mb-4">⬅️ 자료함 목록으로</button>
                    <h2 className="text-lg md:text-2xl font-black text-gray-900 mb-4 md:mb-6 leading-tight">{selectedAnalysisData.title}</h2>

                    {/* 💻📱 반응형 조율: 데스크톱에서는 그리드, 모바일에서는 터치 가로스크롤 수행 */}
                    <div className="flex md:grid md:grid-cols-8 overflow-x-auto whitespace-nowrap bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-4 md:mb-6 gap-1 text-center no-scrollbar">
                      {subTabs.map((tab) => (
                        <button key={tab} onClick={() => setCurrentSubTab(tab)} className={`text-center py-2 md:py-2.5 px-4 md:px-0 text-xs font-bold rounded-lg cursor-pointer transition-all border-none inline-block md:block ${currentSubTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{tab}</button>
                      ))}
                    </div>

                    {/* 상세 컨텐츠 본문 영역 (모바일용 미니 원터치 [💬 질문] 버튼 유기적 탑재) */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm min-h-[200px]">
                      {currentSubTab === '종합' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">📜 데이터셋 메타 개요 요약</h3><button onClick={() => handleQuickAsk("데이터셋 메타 개요 요약")} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="text-xs md:text-sm text-gray-600 leading-relaxed m-0 bg-gray-50 p-4 rounded-xl">본 데이터셋은 {selectedAnalysisData.subtitle}에서 승인 및 개방한 연구 표준 지표 데이터입니다. 공모전 배경 근거로 연계 활용하기 아주 적합한 메타 구조를 지니고 있습니다.</p>
                        </div>
                      )}
                      {currentSubTab === '통계' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">🤖 AI 가설 검정 및 정량 분석 로그</h3>{selectedAnalysisData.isUploaded && <button onClick={() => handleQuickAsk("AI 통계 가설 검정 로그")} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button>}</div>
                          {selectedAnalysisData.isUploaded ? (
                            <pre className="text-[11px] md:text-xs text-green-400 bg-gray-950 p-4 rounded-xl font-mono leading-relaxed overflow-x-auto shadow-inner">{`> summary(lm(Formula = Main_Target ~ Var_A + Var_B, data = user_dataset))\n\nEstimate Std. Error t value Pr(>|t|)\nVar_A_Value  0.81245    0.01512   53.73   <2e-16 ***`}</pre>
                          ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs md:text-sm">🔒 통계 분석 엔진 파일 미비. 바깥 목록에서 CSV 데이터셋 파일을 먼저 연동하세요.</div>
                          )}
                        </div>
                      )}
                      {currentSubTab === '법' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">⚖️ 소관 및 규제 근거 법령 단락</h3><button onClick={() => handleQuickAsk(selectedAnalysisData.law)} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-4 bg-blue-50 text-xs md:text-sm text-blue-900 rounded-xl leading-relaxed m-0 font-semibold">{selectedAnalysisData.law}</p>
                        </div>
                      )}
                      {currentSubTab === '기능' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">⚙️ 데이터 활용 행정적 기능</h3><button onClick={() => handleQuickAsk(selectedAnalysisData.function)} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-4 bg-gray-50 text-xs md:text-sm text-gray-700 rounded-xl leading-relaxed m-0">{selectedAnalysisData.function}</p>
                        </div>
                      )}
                      {currentSubTab === '목적' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">🎯 공공 개방 및 아카이빙 목적</h3><button onClick={() => handleQuickAsk(selectedAnalysisData.purpose)} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-4 bg-gray-50 text-xs md:text-sm text-gray-700 rounded-xl leading-relaxed m-0">{selectedAnalysisData.purpose}</p>
                        </div>
                      )}
                      {currentSubTab === '조직' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">🏢 데이터 거버넌스 소관 부처 직제</h3><button onClick={() => handleQuickAsk(selectedAnalysisData.org)} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-4 bg-gray-50 text-xs md:text-sm text-gray-700 rounded-xl leading-relaxed m-0 font-bold">{selectedAnalysisData.org}</p>
                        </div>
                      )}
                      {currentSubTab === '사업' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center"><h3 className="text-sm md:text-base font-bold text-gray-900 m-0">💸 국책 추진 및 예산 연계 사업 사업</h3><button onClick={() => handleQuickAsk(selectedAnalysisData.business)} className="md:hidden text-[10px] bg-blue-50 border-none font-bold rounded px-2 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-4 bg-slate-900 text-xs md:text-sm text-slate-100 rounded-xl leading-relaxed m-0 font-medium">{selectedAnalysisData.business}</p>
                        </div>
                      )}
                      {currentSubTab === '도움말' && (
                        <p className="text-xs md:text-sm text-gray-600 m-0 leading-relaxed">• <strong>스마트 시나리오</strong>: 💻 PC에서는 마우스 드래그를 통해 즉시 챗봇에 연계 바인딩할 수 있으며, 📱 모바일 터치 스크린에서는 상단의 원터치 질문 단추로 즉각 가설 고도화 매핑 상담을 시작할 수 있습니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. 챗봇 섹션 */}
            {currentMenu === '챗봇' && (
              <div className="w-full max-w-3xl flex flex-col h-[70vh] md:h-[75vh] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-left">
                <div className="bg-gray-950 text-white px-5 py-3.5 flex justify-between items-center select-none shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg">🤖</span>
                    <div>
                      <span className="font-bold text-xs md:text-sm block">연구 매핑 AI 어시스턴트</span>
                      <span className="text-[9px] md:text-[10px] text-green-400 font-medium">● 가설 고도화 엔진 작동 중</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 font-mono hidden md:inline">{reports[activeReportIdx]} 챗룸</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                  {currentChatHistory.map((msg, mIdx) => (
                    <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-3 md:p-4 shadow-sm text-xs md:text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                        {msg.capture && (
                          <div className="mb-2 p-2 bg-black/10 rounded-xl text-[10px] md:text-xs flex flex-col gap-0.5">
                            <span className="font-bold block">📸 첨부된 대시보드 캡처 스냅샷</span>
                            <span className="opacity-80">데이터: {msg.capture.dataTitle} ({msg.capture.sourceTab})</span>
                          </div>
                        )}
                        <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 md:p-4 bg-white space-y-2 md:space-y-3 shrink-0">
                  {attachedCapture && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-[11px] text-amber-800">
                      <span>📎 [전송 대기] <strong>{attachedCapture.dataTitle} ({attachedCapture.sourceTab})</strong> 캡처 스냅샷</span>
                      <button type="button" onClick={() => setAttachedCapture(null)} className="text-amber-500 font-bold bg-none border-none cursor-pointer">X</button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="분석 결과나 인과관계에 대해 질문하세요..." className="flex-1 px-4 py-2.5 md:py-3 border border-gray-300 rounded-xl text-xs md:text-sm focus:outline-none focus:border-blue-500 shadow-inner" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-5 md:px-6 rounded-xl border-none cursor-pointer">전송</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ================= 📱 모바일 전용 하단 고정형 앱 바 (PC에서는 hidden 처리) ================= */}
      {activeReportIdx !== null && (
        <nav className="w-full bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 h-16 flex z-40 select-none shadow-xl md:hidden">
          {menuItems.map((item) => {
            let icon = '🔎';
            if (item === '자료분석') icon = '📊';
            if (item === '챗봇') icon = '🤖';

            return (
              <button
                key={item}
                onClick={() => {
                  setCurrentMenu(item);
                  if (item !== '자료분석') setSelectedAnalysisData(null);
                }}
                className={`flex-1 flex flex-col items-center justify-center border-none bg-transparent cursor-pointer transition-colors ${currentMenu === item ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
              >
                <span className="text-xl mb-0.5">{icon}</span>
                <span className="text-[10px] tracking-tight">{item}</span>
              </button>
            );
          })}
        </nav>
      )}

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [reports, setReports] = useState([]);
  const [activeReportIdx, setActiveReportIdx] = useState(null);

  // 모바일 전용 상위 메뉴 탭 상태 관리 (초기값: 자료검색)
  const [mobileMenu, setMobileMenu] = useState('자료검색');
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

  // 모바일 전용: 상단 보고서 선택 드롭다운 팝업 열림 상태
  const [isReportSelectorOpen, setIsReportSelectorOpen] = useState(false);

  // 가상 화면 캡처 함수
  const handleScreenCapture = () => {
    if (!selectedAnalysisData) return;
    setAttachedCapture({
      sourceTab: currentSubTab,
      dataTitle: selectedAnalysisData.title,
      timestamp: '방금 전 캡처됨'
    });
    alert(`현재 대시보드가 캡처되어 챗봇 탭에 대기 상태로 연동되었습니다!`);
  };

  // 메시지 전송 함수
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() && !attachedCapture) return;

    const currentHistory = chatHistoryByReport[activeReportIdx] || [
      { sender: 'ai', text: '안녕하세요! 현재 수집한 공공데이터 분석 결과물과 정책 법령 지표를 기반으로 공모전 연구 제안서 스토리라인을 다듬어 드릴게요. 궁금한 점을 물어보세요!' }
    ];

    const userMessage = {
      sender: 'user',
      text: chatInput,
      capture: attachedCapture ? { ...attachedCapture } : null
    };

    let aiResponseText = "제시해주신 데이터 구조를 분석해 볼 때, 공모전 제안서의 '기대효과' 파트에 소관 법령 지표를 결합하여 서술하는 방식이 심사위원단에 가장 설득력 있게 다가갈 것입니다.";
    if (attachedCapture) {
      aiResponseText = `🤖 [모바일 캡처 판독 완료]: 보내주신 [${attachedCapture.dataTitle} > ${attachedCapture.sourceTab}] 스냅샷을 분석했습니다. 이 지표를 제안서의 인과관계 논거로 인용하세요!`;
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
    setActiveReportIdx(newIdx);
    setMobileMenu('자료검색');
    
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
    alert(`[${card.title}]이(가) 성공적으로 담겼습니다!`);
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
      if (item.id === dataId) { return { ...item, isUploaded: true, fileName: `data_${dataId}.csv`, rows: '54,128', cols: '16', size: '7.8 MB' }; }
      return item;
    });
    setSavedDataByReport(prev => ({ ...prev, [activeReportIdx]: updated }));
    alert("원본 데이터 파일 연동 성공!");
    const target = updated.find(item => item.id === dataId);
    if (selectedAnalysisData && selectedAnalysisData.id === dataId) setSelectedAnalysisData(target);
  };

  // ⭐ 모바일 한손 터치형 원터치 질문 쏘기 함수
  const handleQuickAsk = (text) => {
    setChatInput(`"${text}" 이 내용의 공모전 제안서 고도화 스토리라인을 추천해줘.`);
    setMobileMenu('챗봇');
  };

  const currentReportSavedData = activeReportIdx !== null ? (savedDataByReport[activeReportIdx] || []) : [];
  const currentChatHistory = chatHistoryByReport[activeReportIdx] || [{ sender: 'ai', text: '안녕하세요! 수집한 공공데이터 분석 결과물과 법령 지표를 기반으로 제안서 스토리라인을 다듬어 드릴게요.' }];

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden select-none">
      
      {/* ================= 📱 상단 모바일 헤더 바 ================= */}
      <header className="w-full bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-30 shadow-sm shrink-0">
        <div className="relative">
          {activeReportIdx !== null ? (
            <button 
              onClick={() => setIsReportSelectorOpen(!isReportSelectorOpen)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm px-3 py-2 rounded-xl border-none cursor-pointer flex items-center gap-1.5"
            >
              📂 {reports[activeReportIdx]} <span className="text-[10px] text-gray-400">▼</span>
            </button>
          ) : (
            <span className="font-extrabold text-base tracking-tight text-blue-600">🏛️ 데이터 매핑 시스템</span>
          )}

          {/* 보고서 전환 드롭다운 모바일 팝업 */}
          {isReportSelectorOpen && (
            <div className="absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 divide-y divide-gray-100 animate-fade">
              <div className="max-h-48 overflow-y-auto pb-1.5">
                {reports.map((report, idx) => (
                  <div 
                    key={idx}
                    onClick={() => { setActiveReportIdx(idx); setSelectedAnalysisData(null); setIsReportSelectorOpen(false); }}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${activeReportIdx === idx ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className="truncate max-w-[140px]">{report}</span>
                    <button onClick={(e) => handleDeleteReport(idx, e)} className="text-gray-300 hover:text-red-500 bg-none border-none cursor-pointer">🗑️</button>
                  </div>
                ))}
              </div>
              <div className="pt-1.5">
                <button onClick={handleCreateReport} className="w-full bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-xl border-none cursor-pointer shadow-sm text-center">+ 새 보고서 추가</button>
              </div>
            </div>
          )}
        </div>

        {/* 모바일 대시보드 내 캡처 단추 레이아웃 제어 */}
        {activeReportIdx !== null && mobileMenu === '자료분석' && selectedAnalysisData && (
          <button onClick={handleScreenCapture} className="bg-gray-900 text-white font-bold text-xs px-3 py-2 rounded-xl border-none cursor-pointer shadow-sm">📸 캡처</button>
        )}
      </header>

      {/* ================= 📦 메인 콘텐트 뷰포트 (스크롤 존) ================= */}
      <main className="flex-1 w-full overflow-y-auto p-4 pb-20 box-border flex flex-col items-center justify-start select-text">
        
        {/* [CASE 1] 보고서가 전무할 때의 초기 웰컴 모바일 카드 스크린 */}
        {activeReportIdx === null ? (
          <div className="w-full my-auto max-w-sm text-center bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="text-5xl mb-4">🚀</div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">공공데이터 매핑</h1>
            <p className="text-xs text-gray-500 leading-relaxed mb-6">
              공모전 기획서 작성 및 데이터 가설 검정을 위한<br />모바일 맞춤형 분석 주머니입니다.
            </p>
            <button onClick={handleCreateReport} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 rounded-xl border-none cursor-pointer shadow">
              ✨ 첫 프로젝트 등록하기
            </button>
          </div>
        ) : (
          
          <div className="w-full max-w-md h-full flex flex-col justify-start">
            
            {/* ── 1. 자료검색 세션 ── */}
            {mobileMenu === '자료검색' && (
              <div className="w-full flex flex-col items-center animate-fade">
                <form onSubmit={handleSearch} className="w-full relative mb-4">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="연구 주제를 입력하세요 (예: 교통)" className="w-full px-5 py-3.5 border border-gray-300 rounded-full text-sm shadow-sm focus:outline-none focus:border-blue-600 box-border" />
                  <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-none border-none text-base cursor-pointer">🔍</button>
                </form>

                {/* 데이터 검색 결과 카드 피드 */}
                <div className="w-full space-y-4">
                  {isSearched ? (
                    dummyCards.map((card) => (
                      <div key={card.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-left relative">
                        <span className="text-[10px] text-blue-600 font-bold tracking-wide block mb-1 uppercase">{card.subtitle}</span>
                        <h3 className="text-base font-bold text-gray-950 mb-2">{card.title}</h3>
                        <p className="text-xs text-gray-600 leading-relaxed m-0 mb-4">{card.content}</p>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                          <span className="text-xs text-gray-400 font-medium">적합도 ★★★☆☆</span>
                          <button onClick={() => handleSaveData(card)} className="bg-gray-900 text-white font-bold text-xs px-4 py-2 rounded-xl border-none cursor-pointer shadow-sm">담기</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-gray-400 text-xs">상단에 키워드를 입력하고 검색을 진행하세요.</div>
                  )}
                </div>
              </div>
            )}

            {/* ── 2. 자료분석 세션 ── */}
            {mobileMenu === '자료분석' && (
              <div className="w-full animate-fade">
                
                {/* [CASE 2-A] 수집 데이터 보관함 리스트 */}
                {!selectedAnalysisData ? (
                  <div className="w-full space-y-4">
                    {currentReportSavedData.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-2xl py-12 text-center text-gray-400 bg-white text-xs px-6">
                        <p className="font-medium m-0">분석 보관함이 비어있습니다.</p>
                        <p className="text-[11px] mt-1 m-0">자료검색 메뉴에서 기획서에 담을 공공데이터를 빌드업해 주세요.</p>
                      </div>
                    ) : (
                      currentReportSavedData.map((data) => (
                        <div key={data.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between relative">
                          <button onClick={(e) => handleRemoveSavedData(data.id, e)} className="absolute top-4 right-4 bg-none border-none text-gray-300 hover:text-red-500 text-base cursor-pointer">🗑️</button>
                          <div>
                            <span className="text-[10px] text-gray-400 font-medium block mb-1">{data.subtitle}</span>
                            <h3 className="text-base font-bold text-gray-950 mb-4 pr-6 leading-tight">{data.title}</h3>
                            
                            {/* 모바일 콤팩트 파일 업로드 모듈 */}
                            <div className="rounded-xl p-3 bg-gray-50 mb-4 text-center border border-dashed border-gray-200">
                              {data.isUploaded ? (
                                <span className="text-xs font-mono text-blue-600 font-bold">📎 {data.fileName} (연동됨)</span>
                              ) : (
                                <button onClick={() => handleSimulateUpload(data.id)} className="bg-white border border-gray-300 text-gray-700 text-[11px] py-1 px-2.5 rounded font-bold shadow-sm">💻 CSV 파일 업로드</button>
                              )}
                            </div>
                          </div>
                          <button onClick={() => { setSelectedAnalysisData(data); setCurrentSubTab('종합'); }} className="w-full font-bold py-2.5 px-4 rounded-xl text-center text-xs border-none cursor-pointer bg-gray-950 text-white shadow-sm">대시보드 분석 스페이스 진입 ➡️</button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  
                  /* [CASE 2-B] 8대 마스터 탭 상세 모바일 오버레이 화면 */
                  <div className="w-full flex flex-col">
                    <button onClick={() => setSelectedAnalysisData(null)} className="w-max bg-white text-gray-700 border border-gray-300 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer shadow-sm mb-4">⬅️ 자료함 목록</button>
                    <h2 className="text-lg font-black text-gray-900 mb-4 leading-tight">{selectedAnalysisData.title}</h2>

                    {/* ⭐ 모바일 특화: 8대 분석 메뉴 탭 가로 스크롤 레이아웃 터치 활성화 */}
                    <div className="flex overflow-x-auto whitespace-nowrap bg-white border border-gray-200 rounded-xl p-1 gap-1 mb-4 no-scrollbar">
                      {subTabs.map((tab) => (
                        <button key={tab} onClick={() => setCurrentSubTab(tab)} className={`inline-block px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all border-none ${currentSubTab === tab ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>{tab}</button>
                      ))}
                    </div>

                    {/* 정성/정량 분석 세부 내용 본문 창 */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm min-h-[160px] text-left">
                      {currentSubTab === '종합' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">개요 스냅샷</h4><button onClick={() => handleQuickAsk("데이터셋 개요 기술통계")} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="text-xs text-gray-700 leading-relaxed m-0 font-medium">본 자료는 {selectedAnalysisData.subtitle} 소관의 공공 정보 지표입니다. 정책 제안서의 핵심 논거 단락으로 치환해 구성하기 탁월합니다.</p>
                        </div>
                      )}
                      {currentSubTab === '통계' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">AI 계량 통계 모델</h4>{selectedAnalysisData.isUploaded && <button onClick={() => handleQuickAsk("R 계량 통계 분석 로그")} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button>}</div>
                          {selectedAnalysisData.isUploaded ? (
                            <pre className="text-[10px] text-green-400 bg-gray-950 p-3 rounded-xl font-mono overflow-x-auto leading-tight">{`> lm(Target ~ Var_A)\nCoefficients:\nEstimate  Std.Error  t-value\n1.74512   0.02415    72.25\nPr(>|t|)  < 2e-16 ***`}</pre>
                          ) : (
                            <p className="text-xs text-gray-400 text-center py-4">🔒 통계 파일 미부착 상태입니다.</p>
                          )}
                        </div>
                      )}
                      {currentSubTab === '법' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">⚖️ 소관 근거 법령 법률</h4><button onClick={() => handleQuickAsk(selectedAnalysisData.law)} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-3 bg-blue-50 text-xs text-blue-900 rounded-xl leading-relaxed m-0 font-semibold">{selectedAnalysisData.law}</p>
                        </div>
                      )}
                      {currentSubTab === '기능' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">⚙️ 행정적 수행 기능</h4><button onClick={() => handleQuickAsk(selectedAnalysisData.function)} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-3 bg-gray-50 text-xs text-gray-700 rounded-xl leading-relaxed m-0">{selectedAnalysisData.function}</p>
                        </div>
                      )}
                      {currentSubTab === '목적' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">🎯 공공 개방 목적성</h4><button onClick={() => handleQuickAsk(selectedAnalysisData.purpose)} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-3 bg-gray-50 text-xs text-gray-700 rounded-xl leading-relaxed m-0">{selectedAnalysisData.purpose}</p>
                        </div>
                      )}
                      {currentSubTab === '조직' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">🏢 담당 부처 조직도 직제</h4><button onClick={() => handleQuickAsk(selectedAnalysisData.org)} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-3 bg-gray-50 text-xs text-gray-700 rounded-xl leading-relaxed m-0 font-bold">{selectedAnalysisData.org}</p>
                        </div>
                      )}
                      {currentSubTab === '사업' && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-gray-400 m-0">💸 국책 예산 집행 사업</h4><button onClick={() => handleQuickAsk(selectedAnalysisData.business)} className="text-[10px] bg-gray-100 border-none font-bold rounded px-1.5 py-0.5 text-blue-600 cursor-pointer">💬 질문</button></div>
                          <p className="p-3 bg-slate-900 text-xs text-slate-100 rounded-xl leading-relaxed m-0 font-medium">{selectedAnalysisData.business}</p>
                        </div>
                      )}
                      {currentSubTab === '도움말' && (
                        <p className="text-[11px] text-gray-500 m-0 leading-relaxed">• 모바일 조작 가이드: 텍스트 드래그가 미끄러질 수 있으므로, 우측 상단 문장 분류별로 기본 탑재된 [💬 질문] 아이콘 단추를 원터치로 탭하시면 즉시 스마트 인공지능 연계 상담 피드로 질문 바인딩 전송 처리가 수행됩니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 3. 챗봇 세션 (모바일 메신저 레이아웃 카피) ── */}
            {mobileMenu === '챗봇' && (
              <div className="w-full flex flex-col h-[70vh] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade">
                {/* 챗 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {currentChatHistory.map((msg, mIdx) => (
                    <div key={mIdx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                        {msg.capture && (
                          <div className="mb-1.5 p-2 bg-black/10 rounded-lg text-[10px] flex flex-col gap-0.5">
                            <span className="font-bold">📸 동봉 캡처 스냅샷 정보</span>
                            <span>자료명: {msg.capture.dataTitle} ({msg.capture.sourceTab})</span>
                          </div>
                        )}
                        <p className="m-0 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 하단 전송창 영역 */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white space-y-2">
                  {attachedCapture && (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 text-[10px] text-amber-800">
                      <span>📎 캡처본 첨부 대기중 ({attachedCapture.sourceTab})</span>
                      <button type="button" onClick={() => setAttachedCapture(null)} className="border-none bg-none text-amber-500 font-bold cursor-pointer">X</button>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="분석 결과나 스토리라인을 질문하세요..." className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 shadow-inner" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 rounded-xl border-none cursor-pointer">전송</button>
                  </div>
                </form>
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* ================= 📱 하단 모바일 앱 고정 네비게이션 바 ================= */}
      {activeReportIdx !== null && (
        <nav className="w-full bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 h-16 flex z-40 select-none shadow-lg">
          {menuItems.map((item) => {
            let icon = '🔎';
            if (item === '자료분석') icon = '📊';
            if (item === '챗봇') icon = '🤖';

            return (
              <button
                key={item}
                onClick={() => {
                  setMobileMenu(item);
                  if (item !== '자료분석') setSelectedAnalysisData(null);
                }}
                className={`flex-1 flex flex-col items-center justify-center border-none bg-transparent cursor-pointer transition-colors ${mobileMenu === item ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
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
// DOM이 로드된 후 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM이 로드되었습니다.');
    
    // DOM 요소들 가져오기
    const nameInput = document.getElementById('name-input');
    const addBtn = document.getElementById('add-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resetBtn = document.getElementById('reset-btn');
    const namesList = document.getElementById('names-list');
    const groupsContainer = document.getElementById('groups-container');
    const groupCountInput = document.getElementById('group-count');
    const groupSizeInput = document.getElementById('group-size');
    const shuffleTypeSelect = document.getElementById('shuffle-type');
    
    // 통계 요소들
    const totalPeople = document.getElementById('total-people');
    const groupCountDisplay = document.getElementById('group-count-display');
    const avgGroupSize = document.getElementById('avg-group-size');

    console.log('DOM 요소들:', {
        nameInput: nameInput,
        addBtn: addBtn,
        namesList: namesList
    });

    // 이름 목록과 모둠 결과 저장
    const defaultNames = [
        '강민재', '고민슬', '권진우', '기다인', '김경훈',
        '김다온', '김시영', '김준영', '김하연', '김해나',
        '남가은', '남예준', '손정원', '원지환', '이다예',
        '이로희', '이세경', '이수빈', '이주영', '이찬영',
        '임예성', '정유하', '천지호', '최연우', '최조이'
    ];
    
    // 로컬 스토리지에서 이름 가져오기 (없으면 기본 이름 사용)
    let savedNames = localStorage.getItem('groupNames');
    let names;
    
    if (savedNames) {
        try {
            names = JSON.parse(savedNames);
            // 저장된 이름이 비어있으면 기본 이름 사용
            if (!names || names.length === 0) {
                names = [...defaultNames];
                localStorage.setItem('groupNames', JSON.stringify(names));
            }
        } catch (e) {
            console.error('저장된 이름을 불러오는 중 오류 발생:', e);
            names = [...defaultNames];
            localStorage.setItem('groupNames', JSON.stringify(names));
        }
    } else {
        // 저장된 데이터가 없으면 기본 이름 사용
        names = [...defaultNames];
        localStorage.setItem('groupNames', JSON.stringify(names));
    }
    
    let groups = [];
    let groupNames = JSON.parse(localStorage.getItem('customGroupNames')) || [];

    // 알림 표시 함수
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 통계 업데이트 함수
    function updateStats() {
        totalPeople.textContent = names.length;
        groupCountDisplay.textContent = groupCountInput.value;
        
        const avgSize = names.length > 0 && groupCountInput.value > 0 
            ? Math.ceil(names.length / groupCountInput.value) 
            : 0;
        avgGroupSize.textContent = avgSize;
    }

    // 로컬 스토리지에 저장
    function saveNames() {
        localStorage.setItem('groupNames', JSON.stringify(names));
        updateStats();
    }

    // 이름 목록 렌더링
    function renderNames() {
        namesList.innerHTML = '';
        names.forEach((name, index) => {
            const nameItem = document.createElement('div');
            nameItem.className = 'name-item';
            nameItem.innerHTML = `
                <span class="name-text">${name}</span>
                <button class="delete-btn" onclick="deleteName(${index})">삭제</button>
            `;
            namesList.appendChild(nameItem);
        });
        updateStats();
    }

    // 이름 추가 함수
    function addName() {
        console.log('addName 함수가 호출되었습니다.');
        const name = nameInput.value.trim();
        console.log('입력된 이름:', name);
        
        if (!name) {
            showNotification('이름을 입력해주세요!');
            return;
        }
        
        if (names.includes(name)) {
            showNotification('이미 존재하는 이름입니다!');
            return;
        }

        names.push(name);
        nameInput.value = '';
        nameInput.focus();
        renderNames();
        saveNames();
        showNotification(`✅ "${name}" 추가됨`);
        console.log('이름이 성공적으로 추가되었습니다. 현재 이름 목록:', names);
    }

    // 이름 삭제 함수 (전역 함수로 등록)
    window.deleteName = function(index) {
        const name = names[index];
        if (confirm(`"${name}"을(를) 삭제하시겠습니까?`)) {
            names.splice(index, 1);
            renderNames();
            saveNames();
            showNotification(`🗑️ "${name}" 삭제됨`);
        }
    };

    // 모둠 나누기 함수
    function shuffleGroups() {
        if (names.length === 0) {
            showNotification('이름을 먼저 추가해주세요!');
            return;
        }

        const groupCount = parseInt(groupCountInput.value);
        const groupSize = parseInt(groupSizeInput.value);
        const shuffleType = shuffleTypeSelect.value;

        if (groupCount < 2) {
            showNotification('모둠 수는 2개 이상이어야 합니다!');
            return;
        }

        // 모둠당 인원이 설정된 경우 검증
        if (groupSize > 0) {
            const totalCapacity = groupCount * groupSize;
            if (totalCapacity < names.length) {
                const unassignedCount = names.length - totalCapacity;
                const result = confirm(
                    `경고: 모둠당 ${groupSize}명, ${groupCount}개 모둠으로는 ${names.length}명 중 ${unassignedCount}명이 배정되지 않습니다.\n\n` +
                    `계속하시겠습니까? (배정되지 않은 인원은 별도로 표시됩니다)`
                );
                if (!result) return;
            }
        }

        if (shuffleType === 'manual') {
            // 수동 배정 모드
            startManualAssignment();
            return;
        }

        // 이름 배열 복사 및 섞기
        const shuffledNames = [...names];
        
        // Fisher-Yates 셔플 알고리즘
        for (let i = shuffledNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledNames[i], shuffledNames[j]] = [shuffledNames[j], shuffledNames[i]];
        }

        groups = [];
        
        if (shuffleType === 'balanced') {
            // 균등 배정: 각 모둠에 최대한 같은 수의 인원 배정
            const baseSize = Math.floor(shuffledNames.length / groupCount);
            const remainder = shuffledNames.length % groupCount;
            
            let nameIndex = 0;
            for (let i = 0; i < groupCount; i++) {
                const currentGroupSize = baseSize + (i < remainder ? 1 : 0);
                const groupMembers = shuffledNames.slice(nameIndex, nameIndex + currentGroupSize);
                groups.push(groupMembers);
                nameIndex += currentGroupSize;
            }
        } else if (groupSize > 0) {
            // 고정 크기 배정
            for (let i = 0; i < groupCount; i++) {
                const startIndex = i * groupSize;
                const endIndex = startIndex + groupSize;
                const groupMembers = shuffledNames.slice(startIndex, endIndex);
                groups.push(groupMembers);
            }
        } else {
            // 랜덤 배정: 완전히 무작위로 배정 (인원 수 차이가 날 수 있음)
            // 각 모둠에 랜덤하게 배정
            for (let i = 0; i < groupCount; i++) {
                groups.push([]);
            }
            
            shuffledNames.forEach((name) => {
                // 랜덤하게 모둠 선택
                const randomGroupIndex = Math.floor(Math.random() * groupCount);
                groups[randomGroupIndex].push(name);
            });
        }

        renderGroups();
        
        // 배정되지 않은 인원 확인 및 알림
        const assignedNames = groups.flat();
        const unassignedNames = names.filter(name => !assignedNames.includes(name));
        
        if (unassignedNames.length > 0) {
            showNotification(`⚠️ ${unassignedNames.length}명이 배정되지 않았습니다: ${unassignedNames.join(', ')}`);
        } else {
            showNotification(`🎲 ${groupCount}개 모둠으로 나누었습니다!`);
        }
    }

    // 수동 배정 시작 함수
    function startManualAssignment() {
        const groupCount = parseInt(groupCountInput.value);
        
        // 빈 모둠들 초기화
        groups = [];
        for (let i = 0; i < groupCount; i++) {
            groups.push([]);
        }
        
        renderManualAssignment();
        showNotification('수동 배정 모드입니다. 이름을 클릭하여 모둠에 배정하세요!');
    }

    // 수동 배정 렌더링
    function renderManualAssignment() {
        groupsContainer.innerHTML = '';
        
        // 모둠들 렌더링
        groups.forEach((group, index) => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group';
            groupElement.innerHTML = `
                <div class="group-header">
                    <span class="group-title">${getGroupName(index)}</span>
                    <span class="group-number">${group.length}명</span>
                </div>
                <ul class="group-members">
                    ${group.length > 0 ? group.map(name => `
                        <li class="group-member">
                            ${name}
                            <button class="remove-btn" onclick="removeFromGroup(${index}, '${name}')">제거</button>
                        </li>
                    `).join('') : '<li class="group-member" style="color: #999; font-style: italic;">(빈 모둠)</li>'}
                </ul>
            `;
            groupsContainer.appendChild(groupElement);
        });
        
        // 배정되지 않은 인원 표시
        const assignedNames = groups.flat();
        const unassignedNames = names.filter(name => !assignedNames.includes(name));
        
        if (unassignedNames.length > 0) {
            const unassignedElement = document.createElement('div');
            unassignedElement.className = 'group unassigned-group';
            unassignedElement.innerHTML = `
                <div class="group-header">
                    <span class="group-title">⚠️ 배정되지 않은 인원</span>
                    <span class="group-number" style="background: #ff6b6b;">${unassignedNames.length}명</span>
                </div>
                <ul class="group-members">
                    ${unassignedNames.map(name => `
                        <li class="group-member clickable" onclick="assignToGroup('${name}')">
                            ${name} (클릭하여 배정)
                        </li>
                    `).join('')}
                </ul>
            `;
            groupsContainer.appendChild(unassignedElement);
        }
    }

    // 모둠에 배정하는 함수 (전역 함수)
    window.assignToGroup = function(name) {
        const groupCount = parseInt(groupCountInput.value);
        
        // 모둠 선택 다이얼로그
        let groupOptions = '';
        for (let i = 0; i < groupCount; i++) {
            groupOptions += `${i + 1}. ${getGroupName(i)}\n`;
        }
        
        const groupNumber = prompt(`"${name}"을(를) 어느 모둠에 배정하시겠습니까?\n\n${groupOptions}\n번호를 입력하세요 (1-${groupCount})`);
        
        if (groupNumber && !isNaN(groupNumber)) {
            const groupIndex = parseInt(groupNumber) - 1;
            
            if (groupIndex >= 0 && groupIndex < groupCount) {
                // 기존 모둠에서 제거
                groups.forEach(group => {
                    const index = group.indexOf(name);
                    if (index > -1) {
                        group.splice(index, 1);
                    }
                });
                
                // 새 모둠에 추가
                groups[groupIndex].push(name);
                
                renderManualAssignment();
                showNotification(`✅ "${name}"을(를) ${getGroupName(groupIndex)}에 배정했습니다!`);
            } else {
                showNotification('❌ 올바른 모둠 번호를 입력해주세요!');
            }
        }
    };

    // 모둠에서 제거하는 함수 (전역 함수)
    window.removeFromGroup = function(groupIndex, name) {
        const index = groups[groupIndex].indexOf(name);
        if (index > -1) {
            groups[groupIndex].splice(index, 1);
            renderManualAssignment();
            showNotification(`🗑️ "${name}"을(를) 모둠에서 제거했습니다!`);
        }
    };

    // 모둠 결과 렌더링
    function renderGroups() {
        groupsContainer.innerHTML = '';
        
        groups.forEach((group, index) => {
            const groupElement = document.createElement('div');
            groupElement.className = 'group';
            groupElement.innerHTML = `
                <div class="group-header">
                    <span class="group-title">${getGroupName(index)}</span>
                    <span class="group-number">${group.length}명</span>
                </div>
                <ul class="group-members">
                    ${group.length > 0 ? group.map(name => `<li class="group-member">${name}</li>`).join('') : '<li class="group-member" style="color: #999; font-style: italic;">(빈 모둠)</li>'}
                </ul>
            `;
            groupsContainer.appendChild(groupElement);
        });
        
        // 배정되지 않은 인원 표시
        const assignedNames = groups.flat();
        const unassignedNames = names.filter(name => !assignedNames.includes(name));
        
        if (unassignedNames.length > 0) {
            const unassignedElement = document.createElement('div');
            unassignedElement.className = 'group';
            unassignedElement.style.borderColor = '#ff6b6b';
            unassignedElement.style.background = '#fff5f5';
            unassignedElement.innerHTML = `
                <div class="group-header">
                    <span class="group-title" style="color: #d63031;">⚠️ 배정되지 않은 인원</span>
                    <span class="group-number" style="background: #ff6b6b;">${unassignedNames.length}명</span>
                </div>
                <ul class="group-members">
                    ${unassignedNames.map(name => `<li class="group-member" style="background: #ffe6e6; border-left-color: #ff6b6b;">${name}</li>`).join('')}
                </ul>
            `;
            groupsContainer.appendChild(unassignedElement);
        }
    }

    // 전체 삭제 함수
    function clearAll() {
        if (confirm('모든 이름을 삭제하시겠습니까?')) {
            names = [];
            groups = [];
            renderNames();
            renderGroups();
            saveNames();
            showNotification('🗑️ 모든 이름이 삭제되었습니다!');
        }
    }

    // 다시하기 함수
    function resetGroups() {
        if (confirm('모든 데이터를 초기화하고 기본 이름으로 되돌리시겠습니까?')) {
            names = [...defaultNames];
            groups = [];
            localStorage.setItem('groupNames', JSON.stringify(names));
            renderNames();
            renderGroups();
            showNotification('🔄 기본 이름으로 초기화되었습니다!');
        } else {
            if (groups.length > 0) {
                groups = [];
                renderGroups();
                showNotification('🔄 모둠을 다시 나눌 수 있습니다!');
            } else {
                showNotification('먼저 모둠을 나누어주세요!');
            }
        }
    }

    // 모둠 이름 입력 필드 생성
    function createGroupNameInputs() {
        const groupCount = parseInt(groupCountInput.value);
        const groupNamesSection = document.getElementById('group-names-section');
        const groupNamesContainer = document.getElementById('group-names-container');
        
        if (groupCount > 0) {
            groupNamesSection.style.display = 'block';
            groupNamesContainer.innerHTML = '';
            
            for (let i = 0; i < groupCount; i++) {
                const inputGroup = document.createElement('div');
                inputGroup.style.display = 'flex';
                inputGroup.style.flexDirection = 'column';
                inputGroup.style.gap = '5px';
                
                const label = document.createElement('label');
                label.textContent = `${i + 1}모둠`;
                label.style.fontWeight = 'bold';
                label.style.color = '#333';
                label.style.fontSize = '14px';
                
                const input = document.createElement('input');
                input.type = 'text';
                input.placeholder = `모둠 ${i + 1}`;
                input.value = groupNames[i] || '';
                input.style.width = '100%';
                input.style.padding = '10px';
                input.style.border = '2px solid #e1e5e9';
                input.style.borderRadius = '8px';
                input.style.fontSize = '14px';
                input.style.boxSizing = 'border-box';
                
                input.addEventListener('input', function() {
                    groupNames[i] = this.value.trim();
                    saveGroupNames();
                });
                
                inputGroup.appendChild(label);
                inputGroup.appendChild(input);
                groupNamesContainer.appendChild(inputGroup);
            }
        } else {
            groupNamesSection.style.display = 'none';
        }
    }

    // 모둠 이름 저장
    function saveGroupNames() {
        localStorage.setItem('customGroupNames', JSON.stringify(groupNames));
    }

    // 모둠 이름 가져오기
    function getGroupName(index) {
        return groupNames[index] && groupNames[index].trim() !== '' 
            ? groupNames[index] 
            : `${index + 1}모둠`;
    }

    // 이벤트 리스너 등록
    console.log('이벤트 리스너 등록 시작');
    console.log('addBtn 요소:', addBtn);
    
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            console.log('추가 버튼이 클릭되었습니다!');
            addName();
        });
    } else {
        console.error('addBtn을 찾을 수 없습니다!');
    }
    
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', shuffleGroups);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAll);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGroups);
    }
    
    if (nameInput) {
        nameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addName();
            }
        });
    }

    // 설정 변경 시 통계 업데이트
    if (groupCountInput) {
        groupCountInput.addEventListener('change', function() {
            updateStats();
            createGroupNameInputs();
        });
    }
    
    if (groupSizeInput) {
        groupSizeInput.addEventListener('change', updateStats);
    }

    // 초기 렌더링
    renderNames();
    createGroupNameInputs();
    
    console.log('초기화 완료');
    console.log('현재 이름 목록:', names);
    console.log('이름 개수:', names.length);
    
    // 페이지 로드 시 환영 메시지
    setTimeout(() => {
        showNotification('🎯 모둠 정하기에 오신 것을 환영합니다!');
    }, 1000);
    
    // 개발자용: 로컬 스토리지 초기화 (필요시 주석 해제)
    // localStorage.clear();
    // console.log('로컬 스토리지가 초기화되었습니다.');
}); 
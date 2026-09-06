const todo=document.querySelector('#todo')
const progress=document.querySelector('#progress')
const done=document.querySelector('#done');
const togglemodalbtn=document.getElementById('toggle-modal');
const modal= document.querySelector('.modal')
const modalbg=document.querySelector('.bg');
const addTaskButton=document.querySelector('#add-new-task');
const tasks=document.querySelectorAll('.task');
const columnsCount= [todo,progress,done];
let tasksData={}
let draggedElement=null;

function addTask(title,desc,column){
       const div=document.createElement('div')
    div.classList.add('task')
    div.setAttribute('draggable','true')

    div.innerHTML=`
    <div class="task-top">
        <h2>${title}</h2>
        <button class="move-btn" aria-label="Move task to another column" aria-haspopup="true" aria-expanded="false">⋮</button>
    </div>
    <p>${desc}</p>
    <button class='deletebtn'>Delete</button>
    `
    column.appendChild(div);
    div.addEventListener('dragstart',e=>{
        draggedElement=div
    })

    // NEW: "Move to..." menu — tap the ⋮ button to open a small menu
    // listing the OTHER columns, so a task can be moved with a single
    // tap. This is a mobile-friendly fallback next to dragging: no
    // gesture to get right, works the same on touch, mouse, or keyboard.
    const moveButton=div.querySelector('.move-btn');
    moveButton.addEventListener('click',(e)=>{
        e.stopPropagation(); // don't let the click bubble to anything else
        openMoveMenu(div, column, moveButton);
    })

    const deletebutton=div.querySelector('.deletebtn');
    deletebutton.addEventListener('click',()=>{
        // NEW: play the taskFadeOut animation (see style.css) before
        // actually removing the element, instead of an instant vanish.
        // A setTimeout fallback guards against prefers-reduced-motion
        // (which disables the animation, so 'animationend' would never
        // fire) or any other reason the animation doesn't run.
        let removed = false;
        const finishRemoval = () => {
            if (removed) return;
            removed = true;
            div.remove();
            updteTaskCount();
        };
        div.classList.add('removing');
        div.addEventListener('animationend', finishRemoval, { once: true });
        setTimeout(finishRemoval, 300);
    })
    return div;
}
function updteTaskCount(){
       columnsCount.forEach(col=>{
        const tasks=col.querySelectorAll('.task');
        const count=col.querySelector('.right');
        tasksData[col.id]=Array.from(tasks).map(t=>{
            return{
                title: t.querySelector('h2').innerText,
                desc: t.querySelector('p').innerText
            }
        })
     localStorage.setItem('tasks',JSON.stringify(tasksData))
     count.innerText=tasks.length

     // NEW: show a dashed "No tasks yet" placeholder when a column is
     // empty, so it reads as an empty drop target rather than
     // something that failed to load. Removed again as soon as the
     // column has at least one task.
     const existingEmptyState = col.querySelector('.empty-state');
     if (tasks.length === 0) {
         if (!existingEmptyState) {
             const emptyState = document.createElement('div');
             emptyState.classList.add('empty-state');
             emptyState.textContent = 'No tasks yet';
             col.appendChild(emptyState);
         }
     } else if (existingEmptyState) {
         existingEmptyState.remove();
     }
    })
}
//load data from local storage 
if(localStorage.getItem('tasks')){
    const data=JSON.parse(localStorage.getItem('tasks'))
console.log('data from local storage',data)
   
for (const col in data){
        // console.log(col, data[col])
    const column=document.querySelector(`#${col}`);
    
    data[col].forEach(task=>{
      addTask(task.title,task.desc,column)
    })   
}
}
// NEW: run this unconditionally (not just inside the "if" above) so
// the counts and the empty-state placeholders are correct even on a
// brand-new visit with nothing saved yet — previously they'd only
// ever get set once a task was added.
updteTaskCount();

tasks.forEach(task => {
    task.addEventListener('dragstart',function(e){
// console.log(e)
draggedElement=task
    })
});

//drag function
function addDragEventsonColumn(column){
    column.addEventListener('dragenter',(e)=>{
        e.preventDefault();
        column.classList.add('hover-over');
    })
    column.addEventListener('dragleave',(e)=>{
        e.preventDefault();
        column.classList.remove('hover-over')
    })

column.addEventListener('dragover',(e)=>{
    e.preventDefault()
})// ye website ka default behavior off kardega . website kisi element ko doosre element ppe drop hone nahi deta so is ke zariye ham drop karsakte hai 

column.addEventListener('drop',(e)=>{
        e.preventDefault()
        // console.log('drop',e)
        // console.log('dropped',draggedElement,column)
        column.appendChild(draggedElement);
        column.classList.remove('hover-over')
        column.appendChild(draggedElement);
  
    //it will count new task
  updteTaskCount();
    })
}
addDragEventsonColumn(todo);
addDragEventsonColumn(progress);
addDragEventsonColumn(done);

//SIMPLE version but by using this we will create a duplicates of codes to work properly 
// progress.addEventListener('dragenter',function(e){
// // console.log('drag entr',e)
// this.classList.add('hover-over')
// })
// progress.addEventListener('dragleave',(e)=>{
//     progress.classList.remove('hover-over') 
// })

//--------------------------------------------------------------
// "Move to..." menu
// A tap-friendly way to move a task — works the same on mobile,
// mouse, or keyboard. Opened from the ⋮ button added to every task
// above. Shows a small menu with one option per OTHER column
// ("Move to In Progress", "Move to Done", etc.) plus a Cancel
// option. On phones, resposiveness.css turns this same menu into a
// full-width bottom sheet instead of a small dropdown — no JS
// changes needed for that, it's pure CSS at a breakpoint.
//
// (Note: an earlier version of this file also had a Pointer-Events
// based touch-drag implementation as a second way to move tasks on
// touchscreens. It was removed once this menu covered mobile well
// on its own — one clear way to move a task per platform is easier
// to use and maintain than two overlapping ones. Mouse drag above
// is untouched.)
//--------------------------------------------------------------

// Keeps track of which ⋮ button opened the currently-open menu, so we
// can return focus to it (and flip aria-expanded back) when it closes.
let lastMoveAnchor = null;

function openMoveMenu(taskEl, currentColumn, anchorBtn) {
    closeMoveMenu(); // only one menu open at a time

    lastMoveAnchor = anchorBtn;
    anchorBtn.setAttribute('aria-expanded', 'true');

    // Backdrop: covers the whole screen so tapping anywhere outside
    // the menu closes it (same idea as the existing .modal .bg).
    const backdrop = document.createElement('div');
    backdrop.classList.add('move-menu-backdrop');
    backdrop.addEventListener('click', closeMoveMenu);

    const menu = document.createElement('div');
    menu.classList.add('move-menu');
    menu.setAttribute('role', 'menu');

    // One button per column EXCEPT the column the task is already in
    const otherColumns = columnsCount.filter(col => col !== currentColumn);
    otherColumns.forEach(col => {
        const columnLabel = col.querySelector('.heading .left').innerText;
        const optionBtn = document.createElement('button');
        optionBtn.classList.add('move-menu-option');
        optionBtn.setAttribute('role', 'menuitem');
        optionBtn.textContent = `Move to ${columnLabel}`;
        optionBtn.addEventListener('click', () => {
            col.appendChild(taskEl); // same move the drag-and-drop paths use
            updteTaskCount();
            closeMoveMenu();
        });
        menu.appendChild(optionBtn);
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('move-menu-cancel');
    cancelBtn.setAttribute('role', 'menuitem');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', closeMoveMenu);
    menu.appendChild(cancelBtn);

    document.body.appendChild(backdrop);
    document.body.appendChild(menu);

    // Position the menu near the ⋮ button that opened it (desktop/tablet
    // dropdown behaviour). CSS custom properties are used so the mobile
    // bottom-sheet media query can simply ignore/override them.
    const anchorRect = anchorBtn.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    let top = anchorRect.bottom + 8;
    let left = anchorRect.right - menuRect.width;
    left = Math.max(8, Math.min(left, window.innerWidth - menuRect.width - 8));
    menu.style.setProperty('--menu-top', `${top}px`);
    menu.style.setProperty('--menu-left', `${left}px`);

    // Escape key closes the menu, same as clicking the backdrop
    document.addEventListener('keydown', onMoveMenuKeydown);

    // Send keyboard focus into the menu for accessibility
    const firstFocusable = menu.querySelector('.move-menu-option') || cancelBtn;
    firstFocusable.focus();
}

function onMoveMenuKeydown(e) {
    if (e.key === 'Escape') closeMoveMenu();
}

function closeMoveMenu() {
    const existingMenu = document.querySelector('.move-menu');
    const existingBackdrop = document.querySelector('.move-menu-backdrop');
    if (existingMenu) existingMenu.remove();
    if (existingBackdrop) existingBackdrop.remove();
    document.removeEventListener('keydown', onMoveMenuKeydown);

    if (lastMoveAnchor) {
        lastMoveAnchor.setAttribute('aria-expanded', 'false');
        lastMoveAnchor.focus();
        lastMoveAnchor = null;
    }
}

//Modal realted work
togglemodalbtn.addEventListener('click',e=>{
modal.classList.toggle('active')
})
modalbg.addEventListener('click',()=>{
    modal.classList.remove('active')
})

//adding tasks---------------------------------------------

addTaskButton.addEventListener('click',()=>{
    const taskTitle=document.querySelector('#task-title-input').value;
    const taskdesc=document.querySelector('#task-desc-input').value;

    addTask(taskTitle,taskdesc,todo)
//it will count new task
   updteTaskCount();
    modal.classList.remove('active')
    document.querySelector('#task-title-input').value= '';
    document.querySelector('#task-desc-input').value = '';
})

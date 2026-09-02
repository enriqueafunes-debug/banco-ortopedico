
const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n||0));
let data=JSON.parse(localStorage.getItem('bo_demo_consolidado')||'null')||{
 units:[
  {id:1,code:'SR-001',name:'Silla de ruedas',price:2500,guarantee:10000,photo:'',status:'Disponible',where:'Depósito'},
  {id:2,code:'CA-001',name:'Cama ortopédica',price:3500,guarantee:10000,photo:'',status:'Disponible',where:'Depósito'},
  {id:3,code:'AN-001',name:'Andador',price:1200,guarantee:5000,photo:'',status:'Disponible',where:'Depósito'},
  {id:4,code:'MU-001',name:'Muletas',price:800,guarantee:5000,photo:'',status:'Disponible',where:'Depósito'}
 ],rentals:[]
};
let draft={},view='home';
function save(){localStorage.setItem('bo_demo_consolidado',JSON.stringify(data))}
function toast(t){let x=$('#toast');x.textContent=t;x.style.display='block';setTimeout(()=>x.style.display='none',2200)}
function go(v){view=v;render()}
function unit(id){return data.units.find(x=>x.id==id)}
function rental(id){return data.rentals.find(x=>x.id==id)}
function today(){return new Date().toISOString().slice(0,10)}
function addDays(d,days){let x=new Date(d+'T12:00:00');x.setDate(x.getDate()+Number(days));return x.toISOString().slice(0,10)}
function daysBetween(a,b){return Math.max(1,Math.ceil((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000))}
function render(){
 const m=$('#main');
 if(view==='home')m.innerHTML=home();
 if(view==='rentals')m.innerHTML=rentals();
 if(view==='stock')m.innerHTML=stock();
 if(view==='returns')m.innerHTML=returns();
 if(view==='reports')m.innerHTML=reports();
}
function home(){
 let p=data.rentals.filter(x=>x.status==='Pendiente aceptación').length,a=data.rentals.filter(x=>x.status==='Activo').length;
 return `<h2>Inicio</h2><div class="sub">Gestión del Banco Ortopédico</div><div class="grid">
 <button class="card" onclick="newRental(1)"><div class=ico>♿</div><b>Nuevo alquiler</b><span class=mut>Proceso en 3 pasos</span></button>
 <button class="card" onclick="go('rentals')"><div class=ico>📋</div><b>Alquileres</b><span class=mut>${a} activos · ${p} pendientes</span></button>
 <button class="card" onclick="go('stock')"><div class=ico>📦</div><b>Inventario / Stock</b><span class=mut>Código, valor, garantía y foto</span></button>
 <button class="card" onclick="go('returns')"><div class=ico>↩️</div><b>Devolución / Cierre</b><span class=mut>Reporte final y aceptación</span></button></div>
 <div class=panel style="margin-top:12px"><b>Regla de stock</b><p class=mut>El elemento sigue Disponible mientras el contrato está pendiente. Recién al aceptar el cliente pasa a Alquilado.</p></div>`;
}
function newRental(step){
 view='wizard';
 $('#main').innerHTML=`<div class=row><button class="btn light" onclick="go('home')">← Inicio</button><div style="flex:2"><b>Nuevo alquiler</b><div class=mut>Paso ${step} de 3</div></div></div>
 <div class=steps><i class=on></i><i class="${step>1?'on':''}"></i><i class="${step>2?'on':''}"></i></div>`+(step===1?step1():step===2?step2():step3());
 if(step===2)calcRentalStep2();
}
function step1(){return `<h2>1. Cliente</h2><div class=sub>Buscar o cargar un cliente nuevo.</div>
<label>Nombre y apellido</label><input id=n value="${draft.name||'Juan Pérez'}"><label>DNI</label><input id=dni value="${draft.dni||'23.456.789'}">
<label>WhatsApp</label><input id=wa value="${draft.wa||'291 123 4567'}"><label>Dirección</label><input id=addr value="${draft.addr||'Pedro Luro'}">
<br><button class="btn blue full" onclick="saveStep1()">Siguiente: elemento →</button>`}
function saveStep1(){draft.name=$('#n').value;draft.dni=$('#dni').value;draft.wa=$('#wa').value;draft.addr=$('#addr').value;newRental(2)}
function step2(){
 let opts=data.units.filter(x=>x.status==='Disponible').map(x=>`<option value=${x.id}>${x.code} · ${x.name} · ${money(x.price)}/día</option>`).join('');
 return `<h2>2. Elemento y período</h2><div class=sub>Alquiler mínimo 1 día · máximo 90 días.</div>
 <label>Elemento disponible</label><select id=u onchange="calcRentalStep2()">${opts}</select>
 <label>Fecha de inicio</label><input id=start type=date value="${draft.start||today()}" onchange="calcRentalStep2()">
 <label>Días de alquiler</label><input id=rdays type=number min=1 max=90 value="${draft.days||1}" oninput="calcRentalStep2(true)">
 <label>Fecha de vencimiento</label><input id=end type=date readonly>
 <div class=money id=step2calc></div>
 <div class=row><button class="btn light" onclick="newRental(1)">← Atrás</button><button class="btn blue" onclick="saveStep2()">Siguiente: reporte →</button></div>`;
}
function calcRentalStep2(allowBlank){
 let d=$('#rdays'),u=unit(Number($('#u').value));
 if(!d||!u)return;
 if(d.value===''&&allowBlank){$('#end').value='';$('#step2calc').innerHTML='';return}
 let n=Number(d.value); if(!n)n=1;
 if(n<1)n=1;if(n>90)n=90;
 if(d.value!=='')d.value=n;
 let e=addDays($('#start').value,n);
 $('#end').value=e;
 $('#step2calc').innerHTML=`<div><span>Valor diario</span><b>${money(u.price)}</b></div><div><span>Garantía</span><b>${money(u.guarantee)}</b></div><div><span>Alquiler estimado</span><b>${money(u.price*n)}</b></div>`;
}
function saveStep2(){
 let n=Number($('#rdays').value);
 if(!Number.isFinite(n)||n<1||n>90){toast('Ingresá entre 1 y 90 días');return}
 let u=unit(Number($('#u').value));
 draft.uid=u.id;draft.start=$('#start').value;draft.days=n;draft.end=addDays(draft.start,n);draft.g=u.guarantee;newRental(3)
}
function step3(){
 let u=unit(draft.uid),rent=u.price*draft.days,total=rent+draft.g;
 return `<h2>3. Reporte del alquiler</h2><div class=money>
 <div><span>Cliente</span><b>${draft.name}</b></div><div><span>Elemento</span><b>${u.code}</b></div>
 <div><span>${draft.days} día(s) × ${money(u.price)}</span><b>${money(rent)}</b></div>
 <div><span>Garantía</span><b>${money(draft.g)}</b></div>
 <div class=total><span>Total a pagar</span><b>${money(total)}</b></div></div>
 <label>Forma de pago</label><select id=pay><option>Efectivo</option><option>Transferencia</option></select>
 <div class=contract><b>📲 Reporte por WhatsApp</b><p class=mut>Se envía un link al cliente. Hasta que acepte, el stock no cambia.</p></div>
 <div class=row><button class="btn light" onclick="newRental(2)">← Atrás</button><button class="btn yellow" onclick="createRental()">Enviar por WhatsApp</button></div>`;
}
function createRental(){
 let u=unit(draft.uid),rent=u.price*draft.days,id=Date.now();
 let r={id,client:draft.name,dni:draft.dni,wa:draft.wa,uid:u.id,start:draft.start,end:draft.end,days:draft.days,rate:u.price,rentTotal:rent,guarantee:draft.g,initialTotal:rent+draft.g,paymentMethod:$('#pay').value,paid:rent+draft.g,status:'Pendiente aceptación',accepted:false};
 data.rentals.unshift(r);save();view='rentals';render();toast('Reporte preparado para WhatsApp · pendiente de aceptación')
}
function rentals(){
 return `<h2>Alquileres</h2><button class="btn blue full" onclick="newRental(1)">＋ Nuevo alquiler</button>`+
 (data.rentals.length?data.rentals.map(r=>{let u=unit(r.uid);return `<div class=item><div class=itemtop><div><b>${r.client}</b><div class=mut>${u.code} · vence ${r.end}</div></div><span class="badge ${r.status==='Activo'?'active':'pending'}">${r.status}</span></div>
 <div class=mut style="margin-top:8px">Alquiler ${money(r.rentTotal)} · Garantía ${money(r.guarantee)} · ${r.paymentMethod}</div>
 ${!r.accepted?`<button class="btn yellow full" style="margin-top:10px" onclick="acceptRental(${r.id})">📱 Simular aceptación del cliente</button>`:
 r.status!=='Cerrado'?`<button class="btn light full" style="margin-top:10px" onclick="expiry(${r.id})">🔔 Vencimiento / extensión</button>`:''}</div>`}).join(''):`<div class=panel style="margin-top:12px">No hay alquileres todavía.</div>`)
}
function acceptRental(id){let r=rental(id),u=unit(r.uid);r.accepted=true;r.status='Activo';r.acceptedAt=new Date().toLocaleString('es-AR');u.status='Alquilado';u.where=r.client;save();render();toast('Aceptado: elemento actualizado a Alquilado')}
function expiry(id){
 let r=rental(id);
 $('#main').innerHTML=`<h2>Vencimiento</h2><div class=panel><b>${r.client}</b><p>El alquiler vence el ${r.end}.</p></div>
 <label>Días de extensión</label><input id=extdays type=number min=1 max=90 value="1">
 <button class="btn blue full" onclick="extend(${id})">Confirmar extensión</button><br><br>
 <button class="btn yellow full" onclick="markReturn(${id})">Coordinar devolución</button>`;
}
function extend(id){
 let r=rental(id),d=Number($('#extdays').value);if(!d||d<1||d>90){toast('Ingresá entre 1 y 90 días');return}
 r.end=addDays(r.end,d);r.days+=d;r.rentTotal=r.days*r.rate;r.status='Activo';save();go('rentals');toast('Extensión registrada')
}
function markReturn(id){rental(id).status='Pendiente devolución';save();go('returns');toast('Devolución coordinada')}
function stock(){
 return `<h2>Inventario / Stock</h2><button class="btn blue full" onclick="newStock()">＋ Cargar elemento</button>`+
 data.units.map(u=>`<div class=item><div class=itemtop><div><b>${u.code} · ${u.name}</b><div class=mut>${u.where}</div></div><span class="badge ${u.status==='Alquilado'?'pending':u.status==='Mantenimiento'?'maint':'active'}">${u.status}</span></div>
 <div class=mut style="margin-top:8px">Valor diario ${money(u.price)} · Garantía ${money(u.guarantee)} · ${u.photo?'Con foto':'Sin foto'}</div>
 <button class="btn light full" style="margin-top:10px" onclick="editStock(${u.id})">✏ Editar ficha</button></div>`).join('')
}
function newStock(){editStock(null)}
function editStock(id){
 let u=id?unit(id):{code:'',name:'',price:'',guarantee:'',photo:''};
 $('#main').innerHTML=`<h2>${id?'Editar':'Cargar'} elemento</h2>
 <label>Código individual</label><input id=scode value="${u.code}">
 <label>Descripción</label><input id=sname value="${u.name}">
 <label>Valor diario</label><input id=sprice type=number value="${u.price}">
 <label>Garantía</label><input id=sguarantee type=number value="${u.guarantee}">
 <label>Foto</label><input id=sphoto type=file accept="image/*">
 <div class=mut>${u.photo?'Foto cargada: '+u.photo:'Sin foto cargada'}</div><br>
 <button class="btn blue full" onclick="saveStock(${id||0})">Guardar</button><br><br><button class="btn light full" onclick="go('stock')">Cancelar</button>`;
}
function saveStock(id){
 let photo=$('#sphoto').files&&$('#sphoto').files[0]?$('#sphoto').files[0].name:'';
 if(id){let u=unit(id);u.code=$('#scode').value;u.name=$('#sname').value;u.price=Number($('#sprice').value)||0;u.guarantee=Number($('#sguarantee').value)||0;if(photo)u.photo=photo}
 else data.units.push({id:Date.now(),code:$('#scode').value,name:$('#sname').value,price:Number($('#sprice').value)||0,guarantee:Number($('#sguarantee').value)||0,photo,status:'Disponible',where:'Depósito'});
 save();go('stock');toast('Ficha de stock guardada')
}
function returns(){
 let rs=data.rentals.filter(r=>r.accepted&&r.status!=='Cerrado');
 return `<h2>Devolución / Cierre</h2><div class=sub>Reporte final para aceptación del cliente.</div>`+
 (rs.length?rs.map(r=>`<div class=item><b>${r.client}</b><div class=mut>${unit(r.uid).code} · ${r.status}</div><button class="btn blue full" style="margin-top:10px" onclick="closeScreen(${r.id})">Abrir cierre</button></div>`).join(''):`<div class=panel>No hay devoluciones pendientes.</div>`)
}
function closeScreen(id){
 let r=rental(id),u=unit(r.uid),used=daysBetween(r.start,today()),due=used*r.rate,paidRent=Math.min(r.rentTotal,Math.max(0,r.paid-r.guarantee)),pre=Math.max(0,due-paidRent);
 $('#main').innerHTML=`<h2>Reporte final de cierre</h2><div class=panel><b>${r.client}</b><div class=mut>${u.code} · ${u.name}</div></div>
 <div class=money><div><span>Días reales</span><b>${used}</b></div><div><span>Total alquiler al cierre</span><b>${money(due)}</b></div><div><span>Pagos aplicados al alquiler</span><b>${money(paidRent)}</b></div><div><span>Saldo antes de garantía</span><b>${money(pre)}</b></div><div><span>Garantía disponible</span><b>${money(r.guarantee)}</b></div></div>
 <label>Garantía a aplicar al saldo</label><input id=gapply type=number min=0 max="${Math.min(r.guarantee,pre)}" value="0" oninput="calcClose(${id},${due},${paidRent})">
 <label>Forma de pago del saldo final</label><select id=closepay><option>Efectivo</option><option>Transferencia</option></select>
 <label>Estado del elemento</label><select id=condition><option>Buen estado</option><option>Requiere mantenimiento</option><option>Dañado</option></select>
 <div class=money id=balance></div>
 <button class="btn yellow full" onclick="generateCloseReport(${id},${due},${paidRent})">Generar reporte y enviar por WhatsApp</button><br><br>
 <button class="btn light full" onclick="go('returns')">Cancelar</button>`;
 calcClose(id,due,paidRent)
}
function calcClose(id,due,paidRent){
 let r=rental(id),pre=Math.max(0,due-paidRent),apply=Number($('#gapply').value)||0,max=Math.min(r.guarantee,pre);
 if(apply<0)apply=0;if(apply>max)apply=max;
 let bal=Math.max(0,pre-apply),refund=Math.max(0,r.guarantee-apply);
 $('#balance').innerHTML=`<div><span>Garantía aplicada</span><b>${money(apply)}</b></div><div><span>Garantía a devolver</span><b>${money(refund)}</b></div><div class=total><span>Saldo final a pagar</span><b>${money(bal)}</b></div>`;
}
function generateCloseReport(id,due,paidRent){
 let r=rental(id),u=unit(r.uid),pre=Math.max(0,due-paidRent),apply=Number($('#gapply').value)||0,max=Math.min(r.guarantee,pre);if(apply<0)apply=0;if(apply>max)apply=max;
 let bal=Math.max(0,pre-apply),refund=Math.max(0,r.guarantee-apply),cond=$('#condition').value,pay=$('#closepay').value;
 r.closeDraft={date:today(),due,paidRent,preBalance:pre,guaranteeApplied:apply,guaranteeRefund:refund,finalBalance:bal,condition:cond,paymentMethod:pay,status:'Pendiente aceptación cierre'};
 save();
 $('#main').innerHTML=`<h2>Reporte final listo</h2><div class=money>
 <div><span>Cliente</span><b>${r.client}</b></div><div><span>Elemento</span><b>${u.code}</b></div>
 <div><span>Total alquiler</span><b>${money(due)}</b></div><div><span>Garantía aplicada</span><b>${money(apply)}</b></div>
 <div><span>Garantía a devolver</span><b>${money(refund)}</b></div><div><span>Saldo final</span><b>${money(bal)}</b></div>
 <div><span>Forma de pago</span><b>${pay}</b></div><div><span>Estado</span><b>${cond}</b></div></div>
 <div class=contract><b>📲 Enviar link por WhatsApp</b><p class=mut>El cliente revisa y pulsa ACEPTAR CIERRE.</p></div>
 <button class="btn yellow full" onclick="acceptClose(${id})">📱 Simular ACEPTAR CIERRE</button><br><br>
 <button class="btn light full" onclick="go('returns')">Volver</button>`;
}
function acceptClose(id){
 let r=rental(id),u=unit(r.uid),c=r.closeDraft;
 c.status='Cierre aceptado';c.acceptedAt=new Date().toLocaleString('es-AR');r.close=c;r.status='Cerrado';
 u.status=c.condition==='Buen estado'?'Disponible':'Mantenimiento';u.where=c.condition==='Buen estado'?'Depósito':'Mantenimiento';
 save();
 $('#main').innerHTML=`<div class=okbox><div class=big>✅</div><h2>Cierre aceptado</h2><p>${r.client} · ${u.code}</p><div class=money>
 <div><span>Garantía aplicada</span><b>${money(c.guaranteeApplied)}</b></div><div><span>Garantía a devolver</span><b>${money(c.guaranteeRefund)}</b></div><div><span>Saldo final</span><b>${money(c.finalBalance)}</b></div><div><span>Aceptado</span><b>${c.acceptedAt}</b></div></div>
 <button class="btn blue full" onclick="go('home')">Volver al inicio</button></div>`;
}
function reports(){
 let closed=data.rentals.filter(x=>x.status==='Cerrado');
 return `<h2>Reportes</h2><div class=panel><b>Alquileres cerrados: ${closed.length}</b><p class=mut>Historial local de alquileres, aceptaciones y cierres.</p></div>
 <br><button class="btn light full" onclick="localStorage.removeItem('bo_demo_consolidado');location.reload()">Restablecer demo</button>`
}
render();

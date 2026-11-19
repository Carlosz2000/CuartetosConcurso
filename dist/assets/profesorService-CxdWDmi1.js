import{n as e}from"./rolldown-runtime-B8xr6ykz.js";import{n as t,t as n}from"./supabase-CB1mEzEw.js";async function r(e){try{let{data:n,error:r}=await t.from(`cuarteto`).select(`*`).eq(`id_profesor_responsable`,e);if(r)throw r;return n||[]}catch(e){return console.error(`Error al obtener cuartetos del profesor desde Supabase:`,e),[]}}async function i(){try{let{data:e,error:n}=await t.from(`usuario`).select(`
        id_usuario,
        dni,
        nombres,
        apellidos,
        correo_institucional,
        estado,
        id_rol,
        rol (
          id_rol,
          nombre_rol
        )
      `).eq(`estado`,!0).in(`id_rol`,[2,7]);if(n)throw n;return(e||[]).map(e=>{let t=e.rol?.nombre_rol?e.rol.nombre_rol.toLowerCase():``,n=t.includes(`juez`)||t.includes(`jurado`),r=e.nombres&&e.nombres!==`null`?e.nombres:``,i=e.apellidos&&e.apellidos!==`null`?e.apellidos:``;return{id:e.id_usuario,nombre:`${r} ${i}`.trim()||`Docente Habilitado`,dni:e.dni,correo:e.correo_institucional,rolNombre:e.rol?.nombre_rol||`Docente`,esJurado:n}})}catch(e){return console.error(`Error al obtener docentes desde Supabase:`,e),[]}}var a=e((()=>{n()}));export{r as n,i as r,a as t};
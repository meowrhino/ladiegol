/* Lo que el JS añade a cada página (el HTML ya viene escrito del build):
   en la home, el filtro, los loops y el welcome; en un proyecto, el
   reproductor de Vimeo; en /welcome…, el welcome. Los cambios de página
   los hace el navegador, con la transición de la casa (js/transicion.js). */

import { home } from "./home.js";
import { project } from "./project.js";
import { welcome } from "./welcome.js";

const vista = document.body.dataset.vista;
const datos = document.getElementById("welcome");

if (document.querySelector(".home")) home();
if (vista === "project") project();
if (vista === "welcome" && datos) welcome(JSON.parse(datos.textContent));

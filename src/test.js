/**
 * ============================================
 * TEST.JS - COMPOSANT PRINCIPAL
 * ============================================
 * 
 * Ce fichier contient uniquement le composant Test
 * qui sert de page principale pour l'apprentissage React
 */

// ============================================
// IMPORTATIONS
// ============================================
                   // Logo React animé
import './App.css';   
import {useState} from 'react';                             // Feuille de styles CSS

// ============================================
// COMPOSANT PRINCIPAL: TEST
// ============================================

/**
 * Test - Composant racine de l'application
 * 
 * Description:
 * Page d'accueil qui affiche le logo React animé
 * et un lien vers la documentation React
 * 
 * Structure JSX:
 * - div.App: conteneur principal
 *   - header.App-header: en-tête avec fond sombre
 *     - img: logo React animé
 *     - a: lien vers la documentation React
 * 
 * Styles:
 * Les classes CSS (App, App-header, App-logo, App-link)
 * sont définies dans ./App.css
 */



function Compter(){
const[count,setCount]=useState(0);
return(
<div>
  <h1>Compteur:{count}</h1>
  <button onClick={()=>setCount(count+1)}>+1</button>
</div>  
);
}
function Compter1(){
const[count,setCount]=useState(0);
return(
<div>
  <h1>Compteur:{count}</h1>
  <button onClick={()=>setCount(count+1)}>+1</button>
</div>  
);
}
function Affichage({nombreGlobal})
{return(<div><h1>{nombreGlobal}</h1></div>);}




function Bouton({nombreGlobal,onChange}){
  return(<div>
    <h1>Compteur:{nombreGlobal}</h1>
    <button onClick={onChange}>+1</button>
  </div>)
}

function useContainer(){
   const[nom,setNom]=useState('');
   const[age,setAge]=useState(0);

   const changeNom=(nom)=>(setNom(nom));

   return(
   <usePresenter
   nom={nom}
   age={age}
   changer={changeNom}/>
   )

}



function usePresenter({nom,age,changerNom}){
  return(
    <div>
      <h1>Nom:{nom}</h1>
      <h1>Age:{age}</h1>
      <button onClick={changerNom}>Changer le nom</button>
    </div>
  )
}

function Test() {
  const[nombreGlobal,setNombreGlobal]=useState(0);
  return (
    <div>
      <h1>state locale</h1>
      <Compter/>
      < Compter1/>
      <h1>state Globale</h1>
      <Affichage nombreGlobal={nombreGlobal}/>
        <Bouton nombreGlobal={nombreGlobal} onChange={()=>setNombreGlobal(nombreGlobal+1)}/>
    <useContainer/>
    </div>
  );
}

// ============================================
// EXPORTATION
// ============================================

/**
 * Export par défaut du composant Test
 * 
 * Permet d'importer avec:
 * import Test from './test'
 */
export default Test;
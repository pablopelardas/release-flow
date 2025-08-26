# Changelog - TurnosOmintWebAPI

*Generado el 26/8/2025*

## 🚧 Cambios Pendientes

- **IDESAINT-600/feat: get proximos turnos y turno alternativo para cuando falla uno** (135ccf1) - Pablo Pelardas
- **IDESAINT-600/feat: endpoint CancelarV2 devuelve proximos turnos disponibiles con interrvalos de una semana entre medio** (c1f6dde) - Pablo Pelardas

## TurnosOmintWebAPIv1.0.6.288
*15 de agosto de 2025, 17:08*

Merge branch 'master' of codebasehq.com:mindware/clever/omint

### Commits incluidos (3):

- Merge branch 'master' of codebasehq.com:mindware/clever/omint (021e9f7) - Pablo Pelardas
- **fix**: IDESAINT-719/fix: cache de coberturas y planes, ahora el plan lo busca junto a su cobertura (2b74cb5) - Pablo Pelardas
- **feat**: IDESAINT-694/feat: monitoreo omint digital api (127ac91) - PabloPelardas

---

## TurnosOmintWebAPIv1.0.6.284
*12 de agosto de 2025, 16:46*

IDESAINT-694/feat: carpeta monitoreo generico para portar a otras apps

### Commits incluidos (12):

- **feat**: IDESAINT-694/feat: carpeta monitoreo generico para portar a otras apps (81201b8) - Pablo Pelardas
- **feat**: IDESAINT-694/feat: monitoreo generico para reimplementar en otros proyectos (a8a1e39) - Pablo Pelardas
- **feat**: IDESAINT-694/feat: health check (b6e350f) - Pablo Pelardas
- Merge branch 'master' into qa (8207b9a) - Pablo Pelardas
- **fix**: fix conflictos (7afb040) - Pablo Pelardas
- Merge master (9e62b82) - Pablo Pelardas
- **fix**: fix: mapear entroleid en omint digital api cuando se devuelve paciente (542d4b8) - Pablo Pelardas
- **fix**: IDESAINT-698/fix: pacientes duplicados devuelven el primero (2fcfb14) - Pablo Pelardas
- **feat**: IDESAINT-698/feat: se unificaron los flujos de MOLI y CLINICAS para obtener pacientes en un solo servicio. Se reemplazo la dll de turnos por webfeelcore para el flujo de obtener pacientes (57a72a6) - Pablo Pelardas
- Merge branch 'master' into qa (01156f9) - Pablo Pelardas
- **fix**: IDESAINT-683/fix: nro afiliado traido desde webfeel porque tasy no lo devuelve (f33f788) - Pablo Pelardas
- **perf**: IDESAINT-683/perf: se redujo el proceso de search paciente en OmintDigitalAPI para que haga solo lo necesario (eliminación lógica SGH y O2K) (303d52e) - Pablo Pelardas

---

## TurnosOmintWebAPIv1.0.6.267
*30 de julio de 2025, 17:55*

Merge con qa

### Commits incluidos (275):

- Merge con qa (f4b65a7) - PabloPelardas
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (f8ccab9) - Nicolás Bibbó
- **feat**: IDESAINT-553/feat: clasificaciones priorizadas por configuracion en vez de N  o P para incluir APTO FISICO (4d8668d) - PabloPelardas
- **fix**: IDESAINT-541/fix: fecha-log-turnos (fe21ef2) - Pablo Pelardas
- **fix**: HOTFIX: Error en busqueda de pacientes SGH (762735c) - Nicolás Bibbó
- **fix**: IDESAINT-541/fix: trycatch para intento de logeo (6da4825) - Pablo Pelardas
- **feat**: IDESAINT-541/feat: fecha turno en log (938d940) - Pablo Pelardas
- **feat**: IDESAINT-541/feat: uso de logturnosv2 con nuevo SP e informacion extra (2662a99) - Pablo Pelardas
- **fix**: IDESAINT-572/fix: que valide documento antes de intentar federar cuando saca el turno en OmintDigitalAPI (72542b9) - Pablo Pelardas
- **feat**: IDESAINT-572/feat: federacion automatica cuando el paciente existe en webfeel pero no esta relacionado con tasy (0d872ed) - Pablo Pelardas
- **feat**: IDESAINT-572/feat: mejoras logeo citas service y reduccion endpoint TomarTurnoV2 en TomarTurnoV3 para el bot (b0d31ea) - Pablo Pelardas
- Versionado TurnosOmintWebaPI (2423c22) - Nicolás Bibbó
- Merge branch 'preprod-uat' (4be20b0) - Nicolás Bibbó
- Merge branch 'qa' into preprod-uat (0115508) - Nicolás Bibbó
- Merge branch 'IDESA-6777' (7af2a95) - Thiago Santero
- Merge branch 'IDESA-6777' into preprod-uat (3703695) - Thiago Santero
- IDESAINT-618 Si el paciente no existe ni en Tasy ni en Webfeel, devuleve el error correspondiente. (567d264) - Nicolás Bibbó
- merge with IDESA-6777 (c66a8ff) - Thiago Santero
- Se añade el formato correcto para la observación de forma que el front lo muestre bien (2e9444b) - Thiago Santero
- Añadida observación en UpdateEstado para reflejar estados alternativos (61e5c1f) - Thiago Santero
- Merge branch 'preprod-uat' into qa (973eec2) - andres.cabrejas@bp-4.com
- Merge remote-tracking branch 'origin/master' into preprod-uat (77bd426) - andres.cabrejas@bp-4.com
- **fix**: Merge branch 'IDESAINT-594-Hotfix-LogTurnos' (f9d5b26) - andres.cabrejas@bp-4.com
- IDESAINT-594 - se agrega log al insertar en la LogTurnos (459f6e7) - andres.cabrejas@bp-4.com
- Merge branch 'preprod-uat' into qa (8778a9b) - marisol.galain
- Merge branch 'master' into preprod-uat (2f4ca4a) - marisol.galain
- Merge branch 'IDESA-6911' (8c90a40) - marisol.galain
- Merge branch 'master' into IDESA-6911 (ff6dda6) - marisol.galain
- **fix**: Hotfix: Cambiamos el metodo que usa turnos service a usar el correcto para buscar el plan (966e330) - Maximiliano Gonzalez Pazo
- Merge branch 'master' into IDESA-6911 (8b6d9d7) - marisol.galain
- Merge branch 'master' of https://mindware.codebasehq.com/clever/omint (e56dd50) - Chiara Casadei
- IDESAINT-562 Se quita excepcion PacienteDuplicado y se agregan campos en ConvertPacientesFromPortalToWeebfeel (7435796) - Chiara Casadei
- Merge branch 'master' into IDESA-6911 (be7a4a3) - marisol.galain
- Actualización de los métodos de recuperación de agenda en AgendasController (a857be0) - Maximiliano Gonzalez Pazo
- **docs**: IDESAINT-562 Se hacen ajustes en mapeo de response ConvertPacientesFromPortalToWeebfeel y se agregan tipoDoc extra (1c90596) - Chiara Casadei
- **docs**: IDESAINT-562 Se agrega mapeo de otros TipoDoc (1600585) - Chiara Casadei
- IDESAINT-562 Se agregan rutas a mas datos personales y se eliminan comentarios (f2fa2ae) - Chiara Casadei
- IDESAINT-562 Se agrega configuración en ConfigServices y todos los appsettings (e8c783c) - Chiara Casadei
- IDESAINT-562 Se modifica Patients Controller y se agrega PatientService para replicar métodos de TurnosOmintWebAPI/PacienteController (a7b03f4) - Chiara Casadei
- IDESAINT-562 Se configura AppManager para su uso en GetPacienteSGH (c6052ea) - Chiara Casadei
- Merge branch 'master' into IDESA-6911 (ad30d54) - marisol.galain
- **fix**: HOTFIX: Adecuacion de métodos para la refactorización de WebfeelCore. (413a5de) - Chiara Casadei
- Moli: se agrega validación para filtrar recetas de clinicas (21e599c) - marisol.galain
- IDESAINT-552 Se utiliza mismo método para agendables que TurnosOmintWebAPI/MedicosController/Get (222c72d) - Chiara Casadei
- IDESAINT-552 Se crea servicio de mapeo de Agendables de tipo portal a tipo bot (a786cb8) - Chiara Casadei
- IDESAINT-547 Se utiliza mismo método para especialidades que TurnosOmintWebAPI/EspecialiadesController/Get (8c4e61e) - Chiara Casadei
- IDESAINT-547 Se crea servicio con mapeo de Especialidades de tipo portal a tipo bot (62d0bf8) - Chiara Casadei
- IDESAINT-546 Se agrega el Context en Especialidades y se setea ParaWeb en true por defecto (0e1895f) - Nicolás Bibbó
- IDESAINT-539 Bloqueo de cobertura SPF (b936638) - Nicolás Bibbó
- Merge branch 'preprod-uat' into master (cc5f377) - Nicolás Bibbó
- Merge branch 'qa' into preprod-uat (c1aa767) - Nicolás Bibbó
- IDESAINT-497 Se modifican appsettings (02d1f90) - Chiara Casadei
- IDESAINT-497 Se corrige lógica en GetCitas y ConfigServices (655b705) - Chiara Casadei
- IDESAINT-497 Se actualizan Web configs dev y prod (7734a4c) - Chiara Casadei
- IDESAINT-497 Se normaliza lógica de GetCitas y GetExpresoAsync (4720e10) - Chiara Casadei
- IDESAINT-510 Corrección WebApiSettings (7380e7f) - Nicolás Bibbó
- IDESAINT-510 Correccion TasyExternalConfigKey (2b0cfff) - Nicolás Bibbó
- IDESINT-510 Simplifico llamadas a TasyEntityId (30b00ca) - Nicolás Bibbó
- IDESAINT-510 Migracion configs OmintDigitalAPI y TurnosOmintWebAPI (80a9d64) - Nicolás Bibbó
- Normalización de archivos web.config + corrección de constructores de controllers (6170ef9) - Nicolás Bibbó
- Merge branch 'IDESAINT-457_CreatePacienteWefeel' into qa (9abde87) - Nicolás Bibbó
- Adecuación de métodos luego de los cambios de external config (agregar dbContext en los servicios). (b4a8479) - Nicolás Bibbó
- Parametro dbcontext en controladores por cambios en ExternalIO (88a6255) - analia.spicona
- Merge branch 'IDESAINT-469_RangoHorario' into qa (4338886) - Emiliano Medina
- IDESAINT-469 OmintDigitalApi rango horario y tomar turnos v2, LandigRecetaApi para actos de recetas (1f28d90) - Emiliano Medina
- IDESAINT-457 Crea el paciente si no existe en webfeel (4bac598) - Nicolás Bibbó
- Cambios Omintdigitalapi (066fffb) - Bruno Ruiz
- **fix**: Fix de OmintDigitalAPI obtencion de agendas de la sede. Tambien bajo la version del log4net de extenalIO omint y añado a externals faltantes (cc0eb6d) - Maximiliano Gonzalez Pazo
- Mapeo de agendas de sedes TASY (3b0847a) - Maximiliano Gonzalez Pazo
- Mapeo de agenda tasy para OmintDigitalAPI (9c642f6) - Maximiliano Gonzalez Pazo
- se agrega numero de afiliado (77d2b9e) - Diego.santos
- Añado busqueda de agendas por empresa y metodos de busqueda de empresa por CUIT (94c86d6) - Maximiliano Gonzalez Pazo
- Agrego el numero de afiliado al mandarlo a tasy en OmintDigitalAPI (a2e1f6e) - Maximiliano Gonzalez Pazo
- **fix**: Fixes a los metodos de busqueda de pacientes en OmintDigitalAPI (1021c36) - Maximiliano Gonzalez Pazo
- Altero el omintdigitalapi request logging para que vaya a log4net (72b83a4) - Maximiliano Gonzalez Pazo
- ultimos ajustes para Osde (13cfc01) - Diego.santos
- set error en citas controller para cancelar (4c329d9) - Diego.santos
- Añado que mande error cuando no se pudo cancelar en tasy (c760f79) - Maximiliano Gonzalez Pazo
- Añado resultado al cancelar de citas controller (835dffb) - Maximiliano Gonzalez Pazo
- Merge branch 'IDESAINT-285_IncluirCancelarTASY' into qa (4efc2e4) - martina.paz
- Agrega cancelar de tasy en Cancelar de CitasController (d193d3d) - martina.paz
- Agrego nuevo metodo para buscar agendas por cuit del agendable. (52644e9) - Diego.santos
- Get de especialidad para omintdigitalapi (c5ffed7) - Maximiliano Gonzalez Pazo
- Añado los verbos a metodos que le faltaba (f9c2bf5) - Maximiliano Gonzalez Pazo
- Agrego un buscador de Agendables por CUIT (508ec91) - Maximiliano Gonzalez Pazo
- pongo parametrizable la busqueda de por externalid de agendable y especialidad (8c1b8b5) - Maximiliano Gonzalez Pazo
- **fix**: Revert "Fix formato en el nro de documento por longitud erronea" (325b5ce) - marisol.galain
- **fix**: Revert "Fix formato en el nro de documento por longitud erronea" (76814ea) - marisol.galain
- **fix**: Revert "Fix formato en el nro de documento por longitud erronea" (00676ed) - Bruno Ruiz
- Merge branch 'preprod-uat' (e1d25f9) - Bruno Ruiz
- Merge branch 'qa' into preprod-uat (19a28b9) - Bruno Ruiz
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (fccd01a) - Bruno Ruiz
- **fix**: Fix: Se cambia manera de buscar natural person de paciente (10c2b0d) - Bruno Ruiz
- **fix**: Fix formato en el nro de documento por longitud erronea (cc5d573) - marisol.galain
- Merge branch 'preprod-uat' (4c751a7) - Bruno Ruiz
- Merge branch 'qa' into preprod-uat (924db5b) - Bruno Ruiz
- Merge branch 'qa' (8dd3dcf) - martina.paz
- **fix**: Merge branch 'IDESAINT-179_FIX_LogTurnos' into qa (cefe86b) - martina.paz
- **fix**: FIX: Arreglo en if de ReconfirmarTurnos (638f574) - martina.paz
- **fix**: Merge branch 'IDESAINT-179_FIX_LogTurnos' into qa (439bbde) - martina.paz
- **fix**: Fix: ajuste metodo ReconfirmarTurnos, nuevo parametro IdSede (80459ac) - martina.paz
- Merge branch 'qa' into preprod-uat (1a6a5dc) - Bruno Ruiz
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (7f8b2a6) - martina.paz
- **fix**: Fix ajustes metodos LogTurnos (b703c9f) - martina.paz
- **fix**: Fix: Error al parsear plan y cobertura con id en 0. (943d1c7) - Bruno Ruiz
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (e048e03) - Bruno Ruiz
- Upgrade SqlClient 4.8.6 (7b9568d) - Bruno Ruiz
- **fix**: HOTFIX: Devuelvo a IISExpress (17a5b4d) - Maximiliano Gonzalez Pazo
- Merge branch 'preprod-uat' (df41a64) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (30351c6) - Maximiliano Gonzalez Pazo
- **fix**: FIX: Version SQLClient y problema asincronia TurnosOmintWebAPI (5a050da) - Maximiliano Gonzalez Pazo
- **feat**: Add - IdSede en LogTurnos (79bf976) - martina.paz
- Se corrige versión de SqlClient (31214da) - Bruno Ruiz
- Merge branch 'preprod-uat' (fdf4bfb) - Bruno Ruiz
- Merge branch 'qa' into preprod-uat (f01a0c8) - Bruno Ruiz
- Añado configuracion al appsettings (a2152f7) - Maximiliano Gonzalez Pazo
- IDESAINT-150 Cobertura o plan sin federar dispara error. Se mueven metodos a ExternalIO (b10487b) - Emiliano Medina
- **fix**: Fix: Se remueve filtro para obtener turnos de Moli (49c4d68) - Bruno Ruiz
- Merge branch 'preprod-uat' (87b6355) - Bruno Ruiz
- Merge branch 'qa' into preprod-uat (8c6bff7) - Bruno Ruiz
- Se añade faltante de EmpresaCUIT y actualizamos template de config (1bd873a) - Bruno Ruiz
- Merge branch 'preprod-uat' (97f745d) - Bruno Ruiz
- Merge branch 'qa' into preprod-uat (00c77de) - Bruno Ruiz
- Merge branch 'qa' (d8304e0) - Bruno Ruiz
- Se añade natural person para log de confirmacion de turno (77ab9c3) - Bruno Ruiz
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (9d9f3d2) - Bruno Ruiz
- Se añade PatientId a información de turno para LandingPage de recordatorios (55c33ae) - Bruno Ruiz
- Merge branch 'preprod-uat' (0b6fd25) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (a1fc4d8) - Maximiliano Gonzalez Pazo
- Mejora uso externalIO en omintditigalapi (c32b2ae) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (c51bbf7) - Maximiliano Gonzalez Pazo
- Upgrade Log4Net a 16 (dfd9a49) - Maximiliano Gonzalez Pazo
- Corrección de TASYAgenda Unificación (4615ac3) - Maximiliano Gonzalez Pazo
- Filtros turnos web (90cc574) - martina.paz
- Filtro de turnos web (a3ceeaf) - martina.paz
- Filtro de turnos web (bbf7b9f) - martina.paz
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (86f3869) - Bruno Ruiz
- Se añade endpoint para obtener turnos de paciente sin necesidad de sede (f97a2c3) - Bruno Ruiz
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (c3c1d5c) - Maximiliano Gonzalez Pazo
- Rectifico version Log4Net a 2.0.16 (d4d7d82) - Maximiliano Gonzalez Pazo
- **feat**: Feat: Se añade endpoint para obtener turno por id y sede (d58cb3c) - Bruno Ruiz
- **fix**: Fix: Se añade BadRequest al cancelar cita en caso de dar error (c7f95bf) - Bruno Ruiz
- IDESAINT-129_Incorporacion de metodo para llamado de LogTurnos (2a73bf8) - martina.paz
- Merge branch 'qa' into IDESAINT-119_IncorporacionLogTurnos (f28416c) - martina.paz
- Incorporacion log turnos (28d681e) - martina.paz
- **feat**: Feat: Se añade insert de diagnostico a la hora de hacer egreso. (901cb74) - Bruno Ruiz
- Merge branch 'preprod-uat' into qa (5450f90) - Maximiliano Gonzalez Pazo
- Merge branch 'master' into preprod-uat (f95fbae) - Maximiliano Gonzalez Pazo
- Merge branch 'preprod-uat' (af41a33) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (543329d) - Diego.santos
- **fix**: Fix turnos acordados flujo de cancelacion (cbb4a54) - Diego.santos
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (3209793) - Emiliano Medina
- **fix**: HOTFIX: tasy schedule classification en "N" o "P" (503b257) - Emiliano Medina
- Merge branch 'preprod-uat' (4b443e7) - Emiliano Medina
- Merge branch 'qa' into preprod-uat (be47ec9) - Emiliano Medina
- IDESA-6185 Se utiliza las fecha del config para ir al external (da590d0) - Emiliano Medina
- Merge branch 'preprod-uat' (bef981e) - Emiliano Medina
- Merge branch 'qa' into preprod-uat (fd5ce87) - Emiliano Medina
- **fix**: HOTFIX: fecha inicio tasy has value (68347a5) - Emiliano Medina
- **fix**: HOTFIX: fecha inicio tasy tiene valor (0e8042a) - Emiliano Medina
- merge preprod-uat (c8e8497) - Emiliano Medina
- Merge branch 'qa' into preprod-uat (2fe6f71) - Emiliano Medina
- TurnosOmintWebAPI.GetMoliO2K: agrego criterio de filtrado por tipo de atención (1 = presencial, 2 = remoto) (e542e39) - Hernán Bruckner
- Omint/ExternalIO/WebfeelCore: - subo versiones de algunos paquetes vulnerables. - actualizo NReco (7545f72) - Hernán Bruckner
- Upgrado TurnosOmintWebAPI System.Data.SqlClient a la ultima version (107eda1) - Maximiliano Gonzalez Pazo
- Actualizo Newtonsoft.Json version de 13.0.2 a 13.0.3 Cambio uso ImportTurnoByPatient que usaba el entroleid en vez del natural person (7a7ab00) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (d54c49e) - Emiliano Medina
- Agrego el proyecto OmintBR.Panel al repo de Omint (3218972) - Hernán Bruckner
- **fix**: Hotfixes de TASY en OmintDigitalAPI (a215d15) - Maximiliano Gonzalez Pazo
- - En AgendasToEspecialidadesWebfeel añado que no devuelva nulls la lista - OmintDigitalAPI cambios los métodos viejos de TASY a los nuevos - En PatientServices añado que devuelva el plan dentro de la cobertura (ba5265a) - Maximiliano Gonzalez Pazo
- IDESA-6088 Remueve configs tasy innecesarias (bd6e0da) - Emiliano Medina
- IDESA-6072 Elimina isBZT, toma external de sede (e8ca9a8) - Emiliano Medina
- Merge branch 'preprod-uat' (9bea965) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (cad8d59) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (1e6da93) - Maximiliano Gonzalez Pazo
- **feat**: Merge branch 'IDESA-6051_PacienteAdditionalInfo' into qa (8488532) - Emiliano Medina
- IDESA-6051 Insert paciente con informacion adicional. (336fa50) - Emiliano Medina
- IDESA-6062: Adecuaciones de TurnosMOLI/GetProximos y GetProximosPaciente: Se tiene en cuenta la forma de atención del turno (2=remoto) (47a387d) - Hernán Bruckner
- IDESA-6030 Turno en ExternalIO (40841a4) - Emiliano Medina
- TurnosOmintWebAPIv1.0.6 (be7baa8) - Maximiliano Gonzalez Pazo
- email al enviar el turno a tasy (cd8c3f2) - Emiliano Medina
- **feat**: IDESA-5190_6038: Add metodo para obtener ID de Orden (d6c9acf) - bruno.ruiz
- IDESA-5929 Incluye dato de sector al grabar turno (ce48f74) - Emiliano Medina
- IDESA-6013 Limita turnos por fecha en el config (6736b80) - Emiliano Medina
- IDESA-5748 Numero de telefono y Health insurance user code (226ebe5) - Emiliano Medina
- Arregladas las referencias (e4e3e22) - Maximiliano Gonzalez Pazo
- Añado TurnoOmintRecepcionWebAPI (1651a5c) - Maximiliano Gonzalez Pazo
- paciente tasy y federacion unificado (e3a5a0d) - Emiliano Medina
- Merge branch 'preprod-uat' (62754c6) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (a3f6f73) - Maximiliano Gonzalez Pazo
- **fix**: HOTFIX: Pongo los config de cobertura faltantes (c57016c) - Maximiliano Gonzalez Pazo
- **fix**: HOTFIX: Remuevo el participation type a la busqueda de actos de MOLI (cbb982a) - Maximiliano Gonzalez Pazo
- **fix**: HOTFIX: Error en la busqueda en tasy por enviar el parametro incorrecto (22dd075) - Maximiliano Gonzalez Pazo
- **fix**: HOTFIX: Arreglo asincronia en metodos de crear pacientes (1ab04dc) - Maximiliano Gonzalez Pazo
- OmintDigitalAPI: - agrego SociosController (Socios/GetByCredencial y Socios/SearchCreate). - Actualizo una llamada a Acts.GetFiltered en ExamenesController - Subo la versión de Net 5 a 6 y configuro algunos detalles de publicación (1f8f4e4) - Hernán Bruckner
- Agrego claves de config (36e578d) - Maximiliano Gonzalez Pazo
- Merge branch 'preprod-uat' (f791648) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (23fd5fc) - Maximiliano Gonzalez Pazo
- **fix**: HOTFIX: Filtro las agendas de Tasy por ID (2823be8) - Maximiliano Gonzalez Pazo
- Merge branch 'IMDA-1445-ActualizacionSocioDesdeO2k' (5ec2e7a) - andres.cabrejas@bp-4.com
- Una vez que se actualiza el paciente desde o2k se vuelve a leer el paciente de webfeel (1267092) - andres.cabrejas@bp-4.com
- filtrado por médicos que no vienen en la vista (1eaa746) - Luis Blotta
- Merge branch 'preprod-uat' (a4acf6c) - Luis Blotta
- Nuevo método para obtener y crear paciente (f13ad8a) - Luis Blotta
- Agrego Logs (efc8b79) - Luis Blotta
- Merge branch 'preprod-uat' (9e1fa30) - Luis Blotta
- **test**: Quito dias de test (980a906) - Luis Blotta
- **fix**: Fix validación (e7a2403) - Luis Blotta
- Agrego validación de paciente al momento de crear (b763244) - Luis Blotta
- Web config template (b462598) - Luis Blotta
- Filtro Ventanda de turnos (4377590) - Luis Blotta
- update log4net (27ef202) - Luis Blotta
- Validacion en cobertura y externalId especialidad (3760615) - Luis Blotta
- Busco especialidades por ID externo (fb47a78) - Luis Blotta
- **fix**: Fix versions Newtonsoft.Json 13.0.2 (c084170) - andres.cabrejas@bp-4.com
- Merge branch 'IMDA-1120_ErrorAutogestionTurnoMoli' (e566cb7) - andres.cabrejas@bp-4.com
- **fix**: Fix DNI O2k (92429fd) - Luis Blotta
- **fix**: Fix json insert paciente tasy (ebfba69) - Luis Blotta
- Merge remote-tracking branch 'origin/master' into IMDA-1120_ErrorAutogestiónTurnoMoli (8a0bfb8) - andres.cabrejas@bp-4.com
- **fix**: Fix using (a3e4aeb) - andres.cabrejas@bp-4.com
- Una vez actualizado el paciente en UpdateFinanciadorPacienteConO2K se vuleve a leer y se devuelve actualizado Se argrega log (e6b9095) - andres.cabrejas@bp-4.com
- config.template (6a83e88) - Luis Blotta
- Merge branch 'preprod-uat' (227f4ed) - Luis Blotta
- Update version (364e5d6) - Luis Blotta
- Merge branch 'qa' into preprod-uat (335cccc) - Luis Blotta
- Agrego validacion de fecha para obtener turnos (9ce390a) - Luis Blotta
- Se corrige la versión de log4net (ae5a2b6) - andres.cabrejas@bp-4.com
- Merge branch 'Integracion_Bot_Tasy' into qa (a9d697c) - Luis Blotta
- Modificaciones al crear paciente (effad13) - Luis Blotta
- Merge branch 'preprod-uat' (238edf2) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (7b63eb1) - Maximiliano Gonzalez Pazo
- TurnosOmintWebAPIv1.0.4 (ef1235c) - Maximiliano Gonzalez Pazo
- Muevo logica a servicios (26f25e3) - Luis Blotta
- Merge branch 'qa' into Integracion_Bot_Tasy (15cb8cf) - Luis Blotta
- Muevo métodos a controlador PatientMoliController (6739862) - Luis Blotta
- **fix**: Fix mapeo paciente (c6c4884) - Luis Blotta
- Modificaciones en búsqueda y creacion de pacientes (8191f18) - Luis Blotta
- Merge branch 'qa' into Integracion_Bot_Tasy (7e35eb8) - Luis Blotta
- Integracion Bot con Tasy (382fa2e) - Luis Blotta
- TurnosOmintWebAPIv1.0.3 (1bc78ba) - Maximiliano Gonzalez Pazo
- Merge branch 'preprod-uat' (ed3b033) - Maximiliano Gonzalez Pazo
- v1.0.3 (9c34533) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (b0b4197) - Maximiliano Gonzalez Pazo
- Merge branch 'preprod-uat' into qa (07757f0) - Hernán Bruckner
- Merge branch 'master' into preprod-uat (a8d5630) - Hernán Bruckner
- IDESA-5232 OmintDigitalAPI: completo los métodos para Auditoría de terreno (11a6c88) - Hernán Bruckner
- OmintDigitalAPI: agrego 3 métodos para el proyecto de Auditoría de Terreno (ae797c3) - Hernán Bruckner
- Merge branch 'qa' of https://mindware.codebasehq.com/clever/omint into qa (31784a2) - Hernán Bruckner
- Merge branch 'master' into preprod-uat (ebd4231) - Hernán Bruckner
- - ActsController, agrego el método Search - Quito del proyecto la referencia obligatoria a Google Calendar, porque traía problemas (d01db92) - Hernán Bruckner
- Agrego config urlTasy (50b7ee6) - Luis Blotta
- Merge branch 'preprod-uat' into qa (1c4f0b9) - Maximiliano Gonzalez Pazo
- **fix**: HOTFIX: Safeguard del largo del origen en la actualizacion de citas (c8da77d) - Maximiliano Gonzalez Pazo
- IDESA-5142 opciones de publicacion (a8db1e2) - Diego Carrio
- IDESA-5142 Arreglo en la busqueda del paciente del acto (6df8842) - Diego Carrio
- Version1.0.1 (2ea9952) - Maximiliano Gonzalez Pazo
- **docs**: servicio documentos (a91493d) - Diego.santos
- Merge branch 'preprod-uat' (8ea24ef) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (e460e3f) - Maximiliano Gonzalez Pazo
- Agrego versionado a OmintDigitalAPI (02dedc7) - Maximiliano Gonzalez Pazo
- Modifico OmintDigitalAPI para que tome el appname del config (b9710ca) - Maximiliano Gonzalez Pazo
- Merge branch 'preprod-uat' (4f9460a) - Maximiliano Gonzalez Pazo
- Merge branch 'qa' into preprod-uat (7e600f7) - Maximiliano Gonzalez Pazo
- Merge branch 'IDESA-4757_GMUD-2721_Informes-Fleury' into qa (34e6c8d) - Maximiliano Gonzalez Pazo
- Reviertoo cambio enn el processor q se colo (725eb0b) - Santiago Riso
- Migro rama desde repo viejo (deac3ea) - Santiago Riso
- Merge branch 'preprod-uat' into qa (a24e46e) - Hernán Bruckner
- Merge remote-tracking branch 'origin/master' into preprod-uat (7e24611) - Hernán Bruckner
- **fix**: TurnosOmintWebAPI: Pequeño fix. ExternalIO.Tasy estaba mal referenciado (fee212e) - Hernán Bruckner
- Omint.sln (f89686a) - Hernán Bruckner
- **fix**: OmintDigitalAPI fixes y TurnosOmintWebAPI migración de packages.config a PackageReference (a39de67) - Hernán Bruckner
- Omint: Agrego el proyecto NReco.Logging.File (424823f) - Hernán Bruckner
- config (cfb2bfb) - Maximiliano Gonzalez Pazo
- Migracion master (d3580ef) - Maximiliano Gonzalez Pazo
- GIT IGNORE (e633173) - Maximiliano Gonzalez Pazo

---


**PTL CFD Simulation**

**Handoff & Procedure Guide**

*ANSYS Fluent 2025 R2 · Single-Phase Darcy & Eulerian Multiphase · VOF*

ME 352 · University of Wisconsin-Madison · HERD Lab · Spring 2026

**1. Overview and Purpose**

This document provides step-by-step instructions for running new PTL
geometry designs through the simulation workflows established in the
Spring 2026 ME 352 senior design project. It is written for a future
operator who has a meshed fluid domain ready and needs to replicate the
methodology used to compare G10 Gyroid and Lidinoid TPMS variants.

The shared case folders correspond to the following workflows:

  ------------------------------ ---------------------- ---------------------------------------------------------
  **Folder**                     **Type**               **Use**
  Permeability Runs              Single-phase steady    Darcy K and tortuosity extraction for all designs
  Steady Multiphase Runs         Eulerian two-phase     O₂ saturation, pressure, ΔP asymmetry
  G_10_unitcell_VOF              VOF transient          Sharp-interface gas-liquid transport (reference/future)
  G10_unitcell with flow field   Explicit flow domain   Full geometry + meshed fluid domain for new mesh setups
  ------------------------------ ---------------------- ---------------------------------------------------------

  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **WARNING ---** Always work on a COPY of a reference case file. Never overwrite the originals. Rename copies to include the design name, e.g. Lidinoid6_SinglePhase.cas.h5
  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**2. Shared Files and Folder Structure**

Organize your working directory as follows. The UDF file must be
accessible from any case that uses the two-phase workflow.

+---------------------------------------------------------------+
| project/                                                      |
|                                                               |
| meshes/                                                       |
|                                                               |
| NewDesign.msh.h5 \<- your new mesh from nTop + Fluent Meshing |
|                                                               |
| udf/                                                          |
|                                                               |
| electrolysis_sources_one_fluid_domain_x.c \<- do not rename   |
|                                                               |
| cases/                                                        |
|                                                               |
| Permeability_Runs/ \<- copy from shared folder                |
|                                                               |
| Steady_Multiphase_Runs/ \<- copy from shared folder           |
|                                                               |
| G_10_unitcell_VOF/ \<- copy from shared folder                |
|                                                               |
| G10_unitcell_with_flow/ \<- copy from shared folder           |
|                                                               |
| results/                                                      |
|                                                               |
| PTL_Comparison_Tracker.xlsx                                   |
+---------------------------------------------------------------+

**3. Replacing the Mesh in an Existing Case**

When moving to a new PTL geometry, you replace the mesh inside an
existing case file rather than building a new case from scratch. This
preserves all solver settings, boundary condition types, monitors, and
UDF assignments.

**3.1 Method 1 --- Replace Mesh via GUI (Recommended)**

  -- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** Confirmed method per Ansys Knowledge Base: File → Read → Mesh → Replace Mesh. This is the correct path in Fluent 2025 R2. An earlier version of this document incorrectly listed the path as Domain → Mesh → Replace.
  -- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1.  Open Fluent 2025 R2 in Solution Mode (not Meshing Mode).

2.  Open your copied reference case file: File → Open Case\...

3.  Navigate to: File → Read → Mesh

4.  In the dialog that appears, you will see a 'Replace Mesh' option.
    Select your new .msh.h5 file and confirm. Fluent will attempt to map
    the new mesh zones to the existing boundary condition names.

5.  Check the console output. Fluent will list any zones it could not
    match. These must be manually reassigned.

**3.2 Method 2 --- Transfer Settings via Right-Click (Fluent 2025 R2 New
Feature)**

  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** Fluent 2025 R2 introduced a new Transfer Case Settings feature. You can right-click on the Results Outline node to copy and paste settings between two open Fluent sessions, or drag settings from one Fluent session to another. This is an alternative to Replace Mesh when you want finer control over which settings transfer.
  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1.  Open two Fluent sessions side by side: one with your reference case,
    one with your new mesh loaded as a fresh case.

2.  In the reference session, right-click the top-level node in the
    Outline tree.

3.  Select 'Copy Settings'. Then switch to the new session and select
    'Paste Settings'.

4.  Review boundary condition assignments and update any zones that did
    not map correctly.

**3.3 Post-Replacement Zone Verification**

After replacing the mesh by either method, verify all zone assignments
before running. This is the most common source of errors when switching
geometries.

  --------------------------- ---------------------- ---------------------------------------------------------------------------------------------------
  **Setting**                 **Value**              **Notes**
  inlet (bottom face)         velocity-inlet         Bottom face adjacent to electrode. Verify it is the face at the minimum through-plane coordinate.
  outlet (top face)           pressure-outlet        PTL/channel interface. Verify it is the face at the maximum through-plane coordinate.
  wall (PTL solid surfaces)   wall                   All curved TPMS pore surfaces. No-slip.
  periodic faces (x4)         interface / periodic   The four lateral faces. Must be set up separately --- see Section 5.
  --------------------------- ---------------------- ---------------------------------------------------------------------------------------------------

  -- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **CRITICAL ---** Zone names are assigned during domain creation in SpaceClaim, not nTop. The fluid zone in this project was named \'lidinoidgyroidcomparison_solid\' despite being the fluid domain --- this reflects how the geometry was named in SpaceClaim before meshing, not an error in the mesh. The most reliable way to identify zones is through the Mesh Display panel: select a zone name and the corresponding surfaces will highlight in the graphics window. Do not rely on the zone name alone.
  -- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

1.  Run a mesh check: Domain → Mesh → Check. Review the console output
    for any errors or warnings about mesh topology.

2.  Evaluate mesh quality: Domain → Mesh → Quality → Evaluate Mesh
    Quality. In the dialog, select the quality measure (Orthogonal
    Quality, then Aspect Ratio). Click Compute. The minimum orthogonal
    quality and maximum aspect ratio will be reported in the console.
    Record both values. Minimum orthogonal quality should be \> 0.05.

3.  If a degenerate cell is reported (as with the G10 geometry: OQ =
    0.103, AR = 43.7), note its location. It will not prevent
    single-phase runs but will cause Courant spikes in transient VOF
    runs.

**4. Setting Up Periodic Boundary Conditions**

Periodic BCs allow the four lateral faces of the unit cell to act as if
they are connected to an adjacent identical unit cell, simulating an
infinite array. This is essential for accurate PTL hydraulic simulation
--- without it, the walls create artificial flow resistance that does
not exist in a real PTL.

  -- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **WARNING ---** Fluent 2025 R2 changed the default behavior for non-conformal mesh interfaces, making periodic BC setup more complex than in older versions. The TUI workaround below is required. Do not skip it.
  -- --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**4.1 Step-by-Step: Non-Conformal Periodic Interface Setup**

This is the procedure used for all PTL cases in this project. The mesh
faces on opposite sides of the unit cell are NOT node-matched
(non-conformal), so Fluent's conformal \'make-periodic\' command will
fail. Use the interface method instead.

**Step 1 --- Change lateral face zone types to Interface**

1.  Go to Setup → Boundary Conditions.

2.  Locate each of the four lateral face zones (e.g. ymin, ymax, zmin,
    zmax, or whatever your mesh export named them).

3.  For each one: click on the zone name, change the Type drop-down from
    \'wall\' to \'interface\'. Click OK to confirm.

4.  Repeat for all four lateral faces. You should now have four
    interface-type zones.

**Step 2 --- Change Lateral Face Zone Types to Interface via TUI**

Before creating the periodic interfaces, the lateral face zones must be
changed from type \'wall\' to type \'interface\'. This must be done via
TUI for each of the four lateral faces.

+----------------------------------------------------------------------+
| \> /define/boundary-conditions/modify-zones/zone-type                |
|                                                                      |
| Zone name: y_minus                                                   |
|                                                                      |
| New type: interface                                                  |
|                                                                      |
| \> /define/boundary-conditions/modify-zones/zone-type                |
|                                                                      |
| Zone name: y_plus                                                    |
|                                                                      |
| New type: interface                                                  |
|                                                                      |
| (repeat for z_minus and z_plus, or whatever your lateral faces are   |
| named)                                                               |
|                                                                      |
| (zone names depend on how your mesh was exported from                |
| SpaceClaim/ANSYS Meshing)                                            |
+----------------------------------------------------------------------+

  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** Your lateral face zone names will depend on the named selections defined in SpaceClaim. Common names are y_minus/y_plus/z_minus/z_plus, but check Setup → Boundary Conditions to see what your mesh exported.
  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Step 3 --- Disable One-to-One Pairing via TUI**

This step is required in Fluent 2025 R2. The default one-to-one
auto-pairing behavior prevents the Periodic Boundary Conditions checkbox
from appearing in the interface creation dialog. You must disable it
before creating the interfaces.

+------------------------------------------------+
| \> /define/mesh-interfaces/one-to-one-pairing? |
|                                                |
| Enabled? \[yes\] no                            |
|                                                |
| (type \'no\' and press Enter)                  |
|                                                |
| (Fluent will confirm the setting has changed)  |
+------------------------------------------------+

  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **CRITICAL ---** This TUI command must be run BEFORE you create the mesh interfaces in Step 3. If you create the interfaces first and then run this command, you will need to delete them and start over.
  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Step 4 --- Create Periodic Mesh Interfaces in the GUI**

1.  Go to: Domain → Mesh Interfaces → Create/Edit\...

2.  In the \'Create Interface\' section, give the interface a name (e.g.
    \'periodic_y\').

3.  Under \'Interface Zone 1\', select the ymin face zone. Under
    \'Interface Zone 2\', select the ymax face zone.

4.  Check the box labeled \'Periodic Boundary Conditions\'.

5.  Under Periodic Type, select \'Translational\'.

6.  Enter the offset vector. For the y-direction pair: if the unit cell
    is 2.21 mm wide in y, enter \[0, 0.00221, 0\]. For z-direction pair:
    enter \[0, 0, 0.00221\] (adjust to match your geometry dimensions).

7.  Click Create. Fluent will print a message to the console confirming
    the interface was created.

8.  Repeat for the second pair of faces (zmin/zmax). Create a second
    interface named \'periodic_z\'.

  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** The offset vector must exactly match the geometric distance between the two face pairs. If the offset is wrong, Fluent will either fail to create the interface or create one with mismatched nodes. You can measure the offset by checking the domain extents: Domain → Mesh → Info → Size.
  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**Step 5 --- Verify Periodic Interfaces**

1.  After creating both interfaces, go to Setup → Boundary Conditions.
    The four lateral face zones should no longer appear individually ---
    they are now managed by the mesh interfaces.

2.  Run Mesh → Check. The console should confirm periodic zone pairs.
    Look for lines such as: \'Zone X and Zone Y are periodic.\'

3.  If you see error messages about mismatched zone sizes or
    non-overlapping boundaries, re-check your offset vector and zone
    selections.

  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **TIP ---** If the periodic setup appears correct but the solver produces non-physical results (e.g. artificially high pressure gradients at the lateral faces), try the alternative method: use symmetry boundary conditions on two opposing faces and periodic on the other two. Symmetry is less accurate for anisotropic TPMS geometries but avoids periodic setup issues entirely.
  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**5. Single-Phase Darcy Permeability Workflow**

The single-phase simulation drives water through the PTL at a fixed
inlet velocity and measures the resulting pressure drop. Darcy
permeability K is then extracted using:

**K = ( Q × μ × L ) / ( A × ΔP )**

*where: Q = volumetric flow rate \[m³/s\] · μ = 0.001 Pa·s · L =
through-plane length \[m\] · A = cross-section area \[m²\] · ΔP =
P_inlet \[Pa\]*

**5.1 Solver and Material Settings**

Verify these are intact in your copied case after mesh replacement:

  --------------- ----------------------- ------------------------------------------
  **Setting**     **Value**               **Notes**
  Solver type     Pressure-Based Steady   
  Material        water-liquid            μ = 0.001 Pa·s, ρ = 1000 kg/m³
  Viscous model   Laminar                 Re \<\< 1 --- no turbulence model needed
  Gravity         Off                     Not needed for single-phase Darcy
  --------------- ----------------------- ------------------------------------------

**5.2 Boundary Conditions**

  ------------------------- ------------------------------------------ ------------------------------------------------------
  **Setting**               **Value**                                  **Notes**
  Velocity Inlet (bottom)   Magnitude = 0.01 m/s, Normal to Boundary   Fixed for ALL designs --- do not change between runs
  Pressure Outlet (top)     Gauge pressure = 0 Pa                      Reference; P_outlet = 0 by definition
  Wall (PTL surfaces)       No-slip, stationary                        Default
  Lateral faces             Periodic (see Section 4)                   Must be set up correctly before running
  ------------------------- ------------------------------------------ ------------------------------------------------------

  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** The 0.01 m/s inlet velocity keeps Re \<\< 1 based on pore diameter, keeping the flow within the Darcy regime where K is independent of velocity. Do not increase it --- inertial effects (Forchheimer regime) will cause K to appear artificially lower.
  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**5.3 Solution Methods**

  ---------------------------- -------------------------- ------------------------------------------------------
  **Setting**                  **Value**                  **Notes**
  Pressure-Velocity Coupling   SIMPLE                     
  Gradient                     Least Squares Cell-Based   
  Pressure                     PRESTO!                    Required for complex pore geometry --- do not change
  Momentum                     Second Order Upwind        
  Convergence criteria         1e-4 (all equations)       But always validate with mass flux check
  ---------------------------- -------------------------- ------------------------------------------------------

**5.4 Running and Convergence Validation**

1.  Initialization: Solution → Initialization → Standard Initialize →
    Compute from Inlet. Click Initialize.

2.  Set iterations to 500. Click Run Calculation.

3.  The simulation should converge within 200--400 iterations.

  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **CRITICAL ---** Do NOT rely on residual values alone to confirm convergence. Fluent's automatic 'Check Convergence' feature can falsely report convergence at iteration 1 if the initial residuals fall below the threshold. Before trusting any result, go to: Reports → Fluxes → Mass Flow Rate. Select ALL boundary zones. Click Compute. The net flux shown at the bottom must be \< 0.01% of the total inlet mass flow rate. If it is not, continue iterating.
  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**5.5 Extracting Results**

4.  Inlet mass flow rate: Reports → Fluxes → Mass Flow Rate → select
    inlet face → Compute. Record \[kg/s\].

5.  Inlet pressure: Reports → Surface Integrals → Area-Weighted Average
    → Static Pressure → select inlet → Compute. Record P_inlet \[Pa\].

6.  Tortuosity: Reports → Surface Integrals → Volume-Weighted Average →
    Velocity Magnitude over the fluid zone. Then repeat for the
    through-plane velocity component (X, Y, or Z depending on your
    BAND_AXIS). Tortuosity τ = V_magnitude / V_through-plane.

**5.6 Recording Results in PTL_Comparison_Tracker.xlsx**

All simulation outputs should be entered into the Simulation Inputs
sheet of PTL_Comparison_Tracker.xlsx. The spreadsheet uses a
color-coding system to guide what you fill in vs. what is calculated
automatically:

  ------------ --------------------------- -----------------------------------------------------------------------------------------------------------------
  **Color**    **Meaning**                 **What to do**
  **Blue**     Fluent simulation outputs   Paste directly from Fluent reports: P_bottom, P_top, Mass Flow Rate, Velocity Magnitude, Through-Plane Velocity
  **Yellow**   Geometry inputs             Fill in from CAD / nTop spec: Porosity, L_x, L_y, L_z (all in mm), Inlet Velocity
  **Green**    Auto-calculated             Do NOT edit --- formulas calculate K, ΔP, K/K_G10, and tortuosity automatically
  ------------ --------------------------- -----------------------------------------------------------------------------------------------------------------

Procedure for each new design:

7.  Add a new row for your design. Copy the row format from an existing
    Lidinoid row.

8.  Fill in the yellow geometry cells: Design Name, Lattice Type,
    Porosity \[%\], L_x \[mm\], L_y \[mm\], L_z \[mm\], Inlet Velocity
    \[m/s\] (= 0.01 for single-phase).

9.  From Fluent: Reports → Fluxes → Volume Flow Rate at the top_surface
    outlet. Paste the value into the Mass Flow \[kg/s\] blue cell. Note:
    Fluent reports this as a negative number for an outlet --- the
    spreadsheet formula uses the absolute value.

10. From Fluent: Reports → Surface Integrals → Area-Weighted Average →
    Static Pressure at bottom_surface. Paste into P_bottom \[Pa\].
    Repeat for top_surface → paste into P_top \[Pa\].

11. From Fluent: Reports → Surface Integrals → Volume-Weighted Average →
    Velocity Magnitude over the fluid zone. Paste into Velocity
    Magnitude \[m/s\]. Then repeat for the through-plane velocity
    component (X-velocity for BAND_AXIS=0) → paste into Through Plane
    Velocity \[m/s\].

12. The green cells will automatically calculate: ΔP, K \[m²\], ΔP/L
    \[Pa/m\], K/Porosity, and Tortuosity (= Velocity Magnitude / Through
    Plane Velocity).

  -- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **CRITICAL ---** Use the Volume Flow Rate report at the top_surface outlet for Mass Flow --- NOT the Flux Mass Flow Rate. Earlier in this project, mass flow rate \[kg/s\] was used instead of volumetric flow rate \[m³/s\], causing \~1000× overestimation of K for all Lidinoid designs. The spreadsheet Darcy formula expects volumetric flow rate \[m³/s\] in the Mass Flow column.
  -- ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** The Results Summary sheet pulls K and tortuosity from Simulation Inputs and calculates K/K_G10 ratios automatically. Check it after entering new data to confirm the normalized comparison updates correctly. The Charts sheet also updates automatically.
  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**5.7 Calculating Permeability K**

+----------------------------------------------------------------+
| /\* Step 1: Convert mass flow rate to volumetric flow rate \*/ |
|                                                                |
| Q \[m\^3/s\] = mdot \[kg/s\] / rho \[kg/m\^3\]                 |
|                                                                |
| = mdot / 1000                                                  |
|                                                                |
| /\* Step 2: Apply Darcy formula \*/                            |
|                                                                |
| K \[m\^2\] = ( Q \* mu \* L ) / ( A \* dP )                    |
|                                                                |
| where:                                                         |
|                                                                |
| mu = 0.001 Pa.s (water dynamic viscosity)                      |
|                                                                |
| L = through-plane domain length \[m\] (e.g. 0.002 for 2 mm)    |
|                                                                |
| A = inlet face area \[m\^2\] = Lx \* Ly of unit cell           |
|                                                                |
| dP = P_inlet \[Pa\] (P_outlet = 0 Pa by definition)            |
|                                                                |
| /\* Step 3: Normalize \*/                                      |
|                                                                |
| K_ratio = K_new / K_G10                                        |
|                                                                |
| K_G10 = 7.90e-11 m\^2 (reference)                              |
+----------------------------------------------------------------+

  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **WARNING ---** UNIT TRAP --- This error occurred in this project: do not use volumetric flow rate directly from a Fluent report row that was labeled in different units. Mass flow rate from Fluent Fluxes is always in kg/s. Divide by 1000 (water density) to get m³/s. Skipping this step caused \~1000× overestimation of K in early spreadsheet versions.
  -- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**6. UDF Reference: electrolysis_sources_one_fluid_domain_x.c**

The UDF injects O₂ mass into a thin reaction band adjacent to the
electrode surface, governed by Faraday's law. It also consumes water
stoichiometrically. Before compiling, you must configure it for your
specific geometry. The key parameters are described below.

**6.1 Parameters You Must Verify for Each New Geometry**

  ------------------- ------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Parameter**       **Current Value**   **What it controls and when to change**
  BAND_AXIS           0 (X-axis)          The coordinate axis that is through-plane (perpendicular to electrode). 0=X, 1=Y, 2=Z. Change this if your geometry's through-plane direction is not X. Check by displaying the mesh and noting which axis runs from electrode to outlet.
  Y0                  -0.00105 m          The coordinate of the electrode face (bottom of the reaction band) along BAND_AXIS. MUST match your geometry. Check with: Domain → Mesh → Info → Size, or hover over the inlet face in the graphics window.
  DELTA               5.0e-5 m (50 μm)    Reaction band thickness. This is \~5% of a typical pore diameter. Do not change unless you have specific reason to.
  J                   10000.0 A/m²        Applied current density. Change only if you want to simulate a different operating point.
  ALPHA_CUT           0.20                Water volume fraction below which O₂ generation shuts off (prevents generating O₂ where no water exists). Set to 0.0 for debugging only.
  WATER_PHASE_INDEX   0                   Sub-thread index of the water phase in the mixture thread. 0 = phase 1 = water (correct for this project setup). If phases are defined differently, check which index corresponds to water.
  ------------------- ------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**6.2 How to Find Y0 for a New Geometry**

Y0 is the single most common error when switching geometries. Here is
the exact procedure:

6.  With your new mesh loaded, go to Domain → Mesh → Info → Size.

7.  The console will print the domain extents: X from \[Xmin\] to
    \[Xmax\], Y from\... etc.

8.  Identify which axis is through-plane (the one that spans your PTL
    thickness, e.g. 0.002 m for a 2 mm PTL). That axis is your
    BAND_AXIS.

9.  Y0 = the minimum coordinate along that axis (the electrode face).
    For example, if X spans from -0.00105 to +0.00095, then Y0 =
    -0.00105 and BAND_AXIS = 0.

10. Verify visually: Setup → Boundary Conditions → click the inlet zone
    → Display. The highlighted face should be at the electrode end.

  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **CRITICAL ---** If Y0 is wrong, the UDF will either fire in mid-domain or not fire at all. You will see zero O₂ source everywhere (no mass generation) or source in the wrong location (O₂ appearing at the wrong end). Always verify by checking the DBG o2_source: console messages after the first timestep --- the coord= value should be between Y0 and Y0+DELTA.
  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**6.3 Annotated Key Lines in the UDF**

The following annotated excerpts highlight the lines a future operator
is most likely to need to modify:

+----------------------------------------------------------------------+
| /\* ============================================================ \*/ |
|                                                                      |
| /\* USER CONFIGURATION SECTION \-- read this before compiling \*/    |
|                                                                      |
| /\* ============================================================ \*/ |
|                                                                      |
| \#define J 10000.0 /\* current density \[A/m\^2\]                    |
|                                                                      |
| Change to simulate different operating point.                        |
|                                                                      |
| 1000 = low current, 50000 = high current density \*/                 |
|                                                                      |
| \#define BAND_AXIS 0 /\* through-plane axis: 0=X, 1=Y, 2=Z           |
|                                                                      |
| CHANGE THIS if your mesh is oriented differently.                    |
|                                                                      |
| Check: Domain -\> Mesh -\> Info -\> Size \*/                         |
|                                                                      |
| \#define Y0 (-0.00105) /\* electrode face coordinate \[m\] along     |
| BAND_AXIS                                                            |
|                                                                      |
| MUST MATCH YOUR GEOMETRY.                                            |
|                                                                      |
| Measure from Domain -\> Mesh -\> Info -\> Size \*/                   |
|                                                                      |
| \#define DELTA (5.0e-5) /\* reaction band thickness \[m\]            |
|                                                                      |
| 50 microns. Adjust only if pore scale changes                        |
|                                                                      |
| dramatically (e.g. macro-scale geometry). \*/                        |
|                                                                      |
| \#define ALPHA_CUT 0.20 /\* O2 generation shuts off when water VOF   |
| \< this                                                              |
|                                                                      |
| 0.20 = shuts off at 20% water (80% gas)                              |
|                                                                      |
| Set to 0.0 to DISABLE shutoff for debugging. \*/                     |
|                                                                      |
| \#define WATER_PHASE_INDEX 0 /\* which phase is water (0 = primary   |
| phase)                                                               |
|                                                                      |
| Verify in Setup -\> Phases that phase 1 = water \*/                  |
+----------------------------------------------------------------------+

+--------------------------------------------------------------------------+
| /\* ============================================================ \*/     |
|                                                                          |
| /\* REACTION BAND LOGIC \-- how the UDF decides where to fire \*/        |
|                                                                          |
| /\* ============================================================ \*/     |
|                                                                          |
| static real in_reaction_band(cell_t c, Thread \*t)                       |
|                                                                          |
| {                                                                        |
|                                                                          |
| real xc\[ND_ND\];                                                        |
|                                                                          |
| C_CENTROID(xc, c, t); /\* get cell centroid coordinates \*/              |
|                                                                          |
| /\* fires only if centroid is between Y0 and Y0+DELTA \*/                |
|                                                                          |
| /\* this is a SLAB check along BAND_AXIS \*/                             |
|                                                                          |
| if (xc\[BAND_AXIS\] \>= Y0 && xc\[BAND_AXIS\] \<= (Y0 + DELTA))          |
|                                                                          |
| return 1.0;                                                              |
|                                                                          |
| return 0.0;                                                              |
|                                                                          |
| }                                                                        |
|                                                                          |
| /\* The source magnitude at full current (no liquid factor or ramp): \*/ |
|                                                                          |
| static real nominal_o2_source(void)                                      |
|                                                                          |
| {                                                                        |
|                                                                          |
| return (J \* MW_O2) / (4.0 \* F \* DELTA);                               |
|                                                                          |
| /\* = (10000 \* 0.032) / (4 \* 96485 \* 5e-5) = 16.58 kg/m\^3/s \*/      |
|                                                                          |
| }                                                                        |
+--------------------------------------------------------------------------+

**6.4 Compiling and Loading the UDF**

5.  In Fluent: User Defined → User Defined Functions → Compiled UDFs\...

6.  Under Source Files, click Add. Navigate to the .c file. Click OK.

7.  Click Build. Watch the console for compilation errors. Common
    errors: wrong include path for udf.h (check Fluent's include
    directory), or syntax errors from editing the file.

8.  Click Load. The functions o2_mass_source and h2o_mass_sink will now
    be available in source term drop-downs.

  -- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **WARNING ---** Use Compiled UDFs only --- NOT Interpreted. The UDF uses static local variables (static int dbg = 0;) which require compiled mode. Interpreted UDFs do not support static variables and will either fail or produce incorrect per-iteration debug counts.
  -- ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**6.5 Assigning UDF Sources via TUI**

This step MUST be done through the TUI. GUI source assignments are
silently dropped after a multiphase model switch in Fluent 2025 R2.

+------------------------------------------------------+
| \> /define/boundary-conditions/fluid                 |
|                                                      |
| /\* First, assign to the OXYGEN phase fluid zone \*/ |
|                                                      |
| Zone name/id: \[type your oxygen fluid zone name\]   |
|                                                      |
| \...                                                 |
|                                                      |
| Specify source terms? \[no\] yes                     |
|                                                      |
| Number of mass source terms \[(0)\] 1                |
|                                                      |
| Source term 0: o2_mass_source                        |
|                                                      |
| /\* Then, assign to the WATER phase fluid zone \*/   |
|                                                      |
| Zone name/id: \[type your water fluid zone name\]    |
|                                                      |
| \...                                                 |
|                                                      |
| Specify source terms? \[no\] yes                     |
|                                                      |
| Number of mass source terms \[(0)\] 1                |
|                                                      |
| Source term 0: h2o_mass_sink                         |
+------------------------------------------------------+

  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **CRITICAL ---** o2_mass_source must be assigned to the OXYGEN phase zone. h2o_mass_sink must be assigned to the WATER phase zone. Assigning them to the wrong phases produces no error but generates gas in the wrong fluid field. Verify: after the first timestep, check the console for \'DBG o2_source:\' messages. If you see them, the UDF is firing in the correct zone.
  -- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** If the UDF fires but produces zero source (src=0.0 in DBG messages), ALPHA_CUT may be too high for your initial conditions. Set ALPHA_CUT = 0.0 in the source file, recompile, and retest. The source should then fire at nominal_o2_source magnitude = 16.58 kg/m³·s regardless of water VOF.
  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**7. Two-Phase Eulerian Multiphase Workflow**

The two-phase simulation adds O₂ generation on top of the single-phase
setup. Use the Steady Multiphase Runs case as your starting point.

**7.1 Multiphase Model Setup**

  ------------------------ --------------------- ---------------------------------------------------------------------------------------------------------------------------
  **Setting**              **Value**             **Notes**
  Model                    Eulerian              NOT VOF, NOT Mixture. Eulerian treats both phases as interpenetrating continua --- appropriate for dispersed bubble flow.
  Number of phases         2                     Phase 1 = water (primary), Phase 2 = oxygen (secondary)
  Formulation              Implicit              
  Body Force Formulation   Implicit Body Force   Enables better pressure-velocity decoupling in multiphase
  Interface Modeling       Dispersed             Appropriate for bubble flow; selects Schiller-Naumann drag
  ------------------------ --------------------- ---------------------------------------------------------------------------------------------------------------------------

**7.2 Phase and Interaction Definitions**

  --------------------- ------------------ ----------------------------------------------------------
  **Setting**           **Value**          **Notes**
  Phase 1 (primary)     water-liquid       μ = 0.001 Pa·s, ρ = 1000 kg/m³
  Phase 2 (secondary)   oxygen (gas)       Create new material: μ = 1.919e-5 Pa·s, ρ = 1.2999 kg/m³
  Bubble diameter       5e-5 m (50 μm)     Constant prescribed diameter
  Drag law              Schiller-Naumann   Appropriate for Re \< 1000 dispersed bubbles
  Surface tension       0.062 N/m          Water-oxygen at \~25°C
  --------------------- ------------------ ----------------------------------------------------------

**7.3 Boundary Conditions**

  ----------------------------------- --------------------------------- -----------------------------------------------------------
  **Setting**                         **Value**                         **Notes**
  Velocity Inlet --- mixture          0.113 m/s normal                  Imposed to continuously supply water to the reaction zone
  Velocity Inlet --- phase 1 water    Volume fraction = 1.0             100% water at inlet
  Velocity Inlet --- phase 2 oxygen   Volume fraction = 0.0             No oxygen entering at inlet
  Pressure Outlet                     0 Pa gauge, backflow VOF_O2 = 0   
  Lateral faces                       Periodic (from Section 4)         
  ----------------------------------- --------------------------------- -----------------------------------------------------------

**7.4 Solution Methods**

  ---------------------------- ---------------------- ---------------------------------------------------------------------------------------------------------------
  **Setting**                  **Value**              **Notes**
  Pressure-Velocity Coupling   Coupled                SIMPLE caused oscillating residuals for Lidinoid. Switch to Coupled if SIMPLE oscillates after 500 timesteps.
  Pressure                     PRESTO!                
  Momentum                     Second Order Upwind    
  Volume Fraction              First Order Upwind     
  Time stepping                Fixed, Δt = 0.0005 s   
  Max iterations / timestep    20--40                 Increase to 60 if residuals don't drop within timestep
  ---------------------------- ---------------------- ---------------------------------------------------------------------------------------------------------------

**7.5 Initialization, Monitors, and Running**

4.  Initialize: Solution → Initialization → Standard Initialize from
    inlet. Then Patch oxygen volume fraction = 0.0 everywhere (Solution
    → Initialization → Patch → select fluid zone → Volume Fraction = 0,
    phase = oxygen).

5.  Enable surface monitors: (a) Mass Flow Rate at outlet, mixture; (b)
    Area-Weighted Average Static Pressure at inlet; (c) Volume Average
    O₂ Volume Fraction over the electrode-adjacent fluid zone.

6.  Set Number of Time Steps = 2000 (Δt = 0.0005 s gives 1.0 s total).
    Click Calculate.

7.  Run until all three monitors plateau. This typically occurs between
    t = 0.5--1.5 s. You do not need to run to physical steady state.

  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
     **NOTE ---** O₂ escape efficiency is NOT a valid comparison metric. At quasi-steady state, mass conservation forces O₂ generated = O₂ leaving the domain for any converged solution. This ratio is trivially \~100% regardless of geometry. Focus on local O₂ saturation and pressure distribution instead.
  -- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

**7.6 Extracting Results**

5.  Catalyst O₂ Saturation: Reports → Surface Integrals → Area-Weighted
    Average → Volume Fraction (oxygen) → select electrode wall or
    reaction band iso-surface. Record as %.

6.  Inlet Pressure: Reports → Surface Integrals → Area-Weighted Average
    → Static Pressure → select inlet. Record \[Pa\].

7.  ΔP Gradient Asymmetry: Create two iso-surfaces at 25% and 75% of PTL
    height. Measure area-weighted pressure at each. Calculate gradient
    \[Pa/mm\] for each half. Asymmetry ratio = lower gradient / upper
    gradient.

**8. Known Issues and Workarounds**

**8.1 Periodic BC Setup Fails or Produces Errors**

**Symptom:** \'Changed zone X to type interface\' message followed by
errors, or solver runs but pressure gradients at lateral faces are
non-physical.

**Cause:** One-to-one pairing was not disabled before interface
creation, or the offset vector is incorrect.

**Fix:** Delete the failed interfaces (Domain → Mesh Interfaces → select
→ Delete). Run the TUI command to disable one-to-one pairing. Re-create
interfaces with correct offset vector. See Section 4.

**8.2 UDF Not Firing (Zero Residuals from Iteration 1)**

**Symptom:** All continuity and momentum residuals are exactly 0.0 from
the first iteration. No DBG messages in console.

**Cause:** GUI source term assignments are silently dropped after a
multiphase model switch. The UDF is compiled and loaded but not actually
connected to any zone.

**Fix:** Reassign via TUI as described in Section 6.5. Confirm by
checking for DBG o2_source: messages after the first timestep.

**8.3 Instant False Convergence**

**Symptom:** Fluent reports Converged after 0--1 iterations.

**Cause:** Check Convergence is enabled in Residual Monitors with a 1e-3
threshold. If initial residuals happen to be below this, Fluent stops
immediately.

**Fix:** Monitors → Residuals → uncheck 'Check Convergence' for all
equations. Always validate convergence via mass flux imbalance (\< 0.01%
of inlet mass flow).

**8.4 Oscillating Residuals in Two-Phase**

**Symptom:** Residuals oscillate without decaying over hundreds of
timesteps.

**Cause:** SIMPLE solver is insufficiently robust for the coupled
water-oxygen system in complex TPMS pore geometry.

**Fix:** Switch to Coupled solver: Solution → Methods →
Pressure-Velocity Coupling → Coupled. Required for Lidinoid2.21 in this
project.

**8.5 UDF Firing Outside Reaction Band (Linear Monitor Trends)**

**Symptom:** O₂ source fires throughout the entire domain. All monitor
plots show linear trends from timestep 1.

**Cause:** A bug where the early return in o2_mass_source references
fac_t before it is declared, causing a nonzero Jacobian (dS\[eqn\]) to
be written to all cells.

**Fix:** Verify the FIRST check in o2_mass_source is \'if (fac_band \<
0.5) { dS\[eqn\] = 0.0; return 0.0; }\' before ANY variable
declarations. The current UDF file is correct --- only recheck if you
edited it.

**8.6 Courant Spikes in VOF / Transient Runs**

**Symptom:** Courant \> 100 warnings, eventually crashing with floating
point exception.

**Cause:** One degenerate mesh cell in G10 geometry (OQ = 0.103, AR =
43.7) generates extreme velocity gradients during interface
reconstruction.

**Options:** (a) Reduce Δt to 1.5e-5 s. (b) Switch from Geo-Reconstruct
to Compressive scheme (eliminates geometric Courant constraint). (c)
Locally remesh the degenerate cell. Eulerian model is significantly less
sensitive to this issue.

**8.7 Zone Names from nTop Are Misleading**

**Symptom:** The fluid zone is named something like
\'lidinoidgyroidcomparison_solid\'. This is not an error.

**Cause:** nTop's boolean subtraction workflow names the resulting fluid
domain after the solid structure that was subtracted. The name is
meaningless.

**Fix:** Always verify zone identity by displaying the mesh and visually
confirming which surface highlights when you select a zone, not by
relying on the zone name.

**9. Validated Reference Results**

Use these values as sanity checks. If your replicated runs differ by
more than 5% on K, check zone assignments and unit conversions first.

  -------------------- -------------- -------------- ------------- --------------- ----------- --------------
  **Design**           **Porosity**   **K \[m²\]**   **K/K_G10**   **ΔP \[Pa\]**   **τ**       **K \[mD\]**
  **G10 (baseline)**   **23.41%**     **7.90e-11**   **1.00**      **126,556**     **2.087**   **80,060**
  Lidinoid1            25.03%         1.20e-10       1.52          83,202          1.349       121,652
  Lidinoid2.21         38.83%         2.93e-10       3.71          34,090          1.581       296,838
  Lidinoid6            35.95%         2.60e-10       3.29          38,388          1.575       263,397
  Lidinoid8            31.87%         1.89e-10       2.39          52,891          1.502       191,502
  Lidinoid10           27.62%         1.28e-10       1.62          78,059          1.459       129,665
  -------------------- -------------- -------------- ------------- --------------- ----------- --------------

*PTL CFD Handoff Guide · ME 352 Senior Design · UW-Madison Spring 2026 ·
ANSYS Fluent 2025 R2 · HERD Lab*

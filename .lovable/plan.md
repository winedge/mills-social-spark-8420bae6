# Plan - Migrate UFC Data to API-Sports

The user wants to switch the UFC data source from SportsDataIO to API-Sports (api-sports.io). This migration will involve updating the server-side fetching logic while maintaining the existing UI types to ensure no visual regressions.

## User Review Required

> [!IMPORTANT]
> This change requires a new API Key from API-Sports. I will need you to provide this key via the `add_secret` tool once the logic is prepared, or you can add it to your environment as `API_SPORTS_KEY`.

- **API Endpoint Change**: Switching from `api.sportsdata.io` to `v1.mma.api-sports.io`.
- **Data Mapping**: I will map the API-Sports response (e.g., `response` array containing events and fights) to our current `UfcEvent` and `UfcFight` types.
- **Fighter Images**: API-Sports provides fighter photos; I will prioritize these while keeping our existing UFC.com and ESPN fallbacks for robustness.

## Proposed Changes

### Data Layer
- **src/lib/ufc.functions.ts**
  - Update `BASE` URL to `https://v1.mma.api-sports.io`.
  - Update `getUfcFights` to use `API_SPORTS_KEY`.
  - Implement a new mapper for API-Sports response structures (Events, Fights, Fighters).
  - Adjust cache logic to fit the new data structure.

### Environment
- Introduce `API_SPORTS_KEY` as the required secret.

## Technical Details

- **Mapping Strategy**: 
  - `Event` -> `UfcEvent`
  - `Fight` -> `UfcFight`
  - `Fighter` -> `UfcFighter`
- **Endpoints to use**:
  - `/leagues` (to find UFC league ID, likely 2)
  - `/events` (to get the schedule)
  - `/fights` (to get bout details for specific events)
- **Rate Limiting**: API-Sports often has strict per-minute/day limits on free tiers; I will ensure the `sports_cache` logic is robustly applied.

## Verification Plan

### Automated Tests
- I will verify the mapping logic by simulating the API-Sports response structure.

### Manual Verification
- Check the UFC section on the homepage and the events page to ensure data (names, dates, fighter images) renders correctly.
- Verify that the "Streamed Event" marking still works (which relies on the `eventId` being consistent or correctly handled).

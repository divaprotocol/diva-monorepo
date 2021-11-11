import { MenuItem, Select } from "@mui/material";
import Container from '@mui/material/Container'

export function Create() {
  return (
    <Container>
      <div>
        Reference Asset
        <Select label="Reference Asset" value={0} >
          <MenuItem value="1">
            1
          </MenuItem>
        </Select>
      </div>
      <div>
        <label>
          Choose Expiry date
          <Select label="Expiry Date" value={0}>
            <MenuItem value="1">
              1
            </MenuItem>
          </Select>
        </label>
      </div>
    </Container>
  );
}
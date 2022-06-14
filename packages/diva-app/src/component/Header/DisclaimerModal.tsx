import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Modal from '@mui/material/Modal'
import Fade from '@mui/material/Fade'
//import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { Button, Checkbox, FormControlLabel } from '@mui/material'

const style = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  height: 400,
  bgcolor: 'black',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

export default function DisclaimerModal() {
  const [open, setOpen] = useState(true)
  const handleClose = () => setOpen(false)
  return (
    <>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        // onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Box sx={style}>
          <Typography id="transition-modal-title" component="h2" color="white">
            <h2>Legal disclaimer</h2>
          </Typography>
          <Typography
            id="transition-modal-description"
            color="white"
            sx={{ mt: 2 }}
          >
            <h5>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit.
              Perspiciatis cupiditate blanditiis hic, dolore magnam, provident
              ipsam, earum fugiat explicabo dicta molestias. Deserunt nulla ipsa
              maxime expedita aut corrupti? Nulla, illo.. Lorem ipsum dolor sit,
              amet consectetur adipisicing elit. Quia optio dolorem odio ducimus
              ratione porro voluptate? Porro tempora assumenda fugit sint
              expedita nam omnis, labore sequi, modi accusantium amet
              placeat!Lorem Lorem ipsum dolor sit amet consectetur adipisicing
              elit. Nobis ducimus voluptatum sed. Fugiat, molestiae dolore.
              Quasi, perferendis ut rerum neque reiciendis vero facere cumque
              alias sit distinctio accusamus, sapiente nobis.
            </h5>
          </Typography>
          <div style={{ display: 'flex' }}>
            <FormControlLabel
              control={<Checkbox />}
              label="I agree the above statement"
              sx={{ color: 'white' }}
            />
            <Button variant="contained" onClick={() => setOpen(false)}>
              Agree and continue
            </Button>
          </div>
        </Box>
      </Modal>
    </>
  )
}

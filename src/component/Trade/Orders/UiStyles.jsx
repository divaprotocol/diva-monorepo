import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';

export const LabelGrayStyle = styled.label`
    font-size : 18px;
    color : gray;
`;

export const LabelStyle = styled.label`
    font-size : 18px;
`;

export const LabelStyleDiv = styled.div`
  width : 70%;
  height: 25px;
  color: #282c34;
  padding : 10px;
  font-size : 24px;
  text-align : left;
`;

export const FormDiv = styled.div`
  display : flex;
  flex-direction : row;
  justify-content: space-around;
  margin-top : 10px;
  margin-bottom : 10px;
  margin-left : 20px;
  margin-right : 20px;
`;

export const FormInput = styled.input`
    width : 30%;
    height: 25px;
    background-color: #F8F8F8;
    border : none;
    padding : 10px;
    text-align: center;
    font-size: 26px;
  `;

export  const RightSideLabel = styled.div`
  width : 30%;
  height: 25px;
  border : none;
  padding : 10px;
  text-align: center;
  font-size: 22px;
`

export const RightSideGrayLabel = styled.div`
    width : 30%;
    height: 25px;
    border : none;
    padding : 10px;
    text-align: center;
    font-size: 22px;
    background-color: #F8F8F8;
  `

export const FormControlDiv = styled.div`
    width : 30%;
    height: 25px;
    border : none;
    text-align: center;
    padding-top:20px;
  `;

export const CreateButtonWrapper = styled.div`
    margin-top : 40px;
    margin-bottom : 20px;
    aligned : center;
  `

export  const LimitOrderExpiryDiv = styled.div`
  aligned : center;
  color: #282c34;
  font-size : 18px;
`;

export const SliderDiv = styled.div`
  width : 60%;
  height: 25px;
  color: #282c34;
  font-size : 24px;
  text-align : left;
`;

export const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
    },
    tab: {
      width: 100,
      minWidth: 50
    },
    formControl: {
      minWidth:115,
    },
    selectEmpty: {
        marginTop: theme.spacing(1),
    }
  }));